const express = require('express');
const router = express.Router();
const Microlocation = require('../models/Microlocation');
const CityContent = require("../models/CityContent");

const isId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v));

const resolveCityId = async (key) => {
  if (!key) return null;
  if (isId(key)) {
    const c = await CityContent.findById(key).select("_id").lean();
    return c?._id || null;
  }
  const c = await CityContent.findOne({ city: String(key).toLowerCase() }).select("_id").lean();
  return c?._id || null;
};

const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");


// ✅ Get all microlocations for a city

router.get("/", async (req, res) => {
  try {
    const includeAll = String(req.query.all || "false").toLowerCase() === "true";
    const includeDeleted = String(req.query.deleted || "false").toLowerCase() === "true";
    const { city, withCity } = req.query;

    const filter = {};
    if (!includeAll) filter.enabled = true;
    if (!includeDeleted) filter.isDeleted = false;

    if (city) {
      const cityId = await resolveCityId(city);
      if (!cityId) return res.json({ success: true, count: 0, data: [] });
      filter.city = cityId;
    }

    let q = Microlocation.find(filter).sort({ name: 1 });
    if (withCity === "true") q = q.populate("city", "city displayCity state");
    const rows = await q.lean();
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});



router.get("/:cityKey", async (req, res) => {
  try {
    const cityId = await resolveCityId(req.params.cityKey);
    if (!cityId) return res.json([]);
    const micros = await Microlocation.find({ city: cityId, isDeleted: false }).sort({ name: 1 });
    return res.json(micros);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/microlocations/:cityKey/:microSlug -> single microlocation (populate city)
router.get("/:cityKey/:microSlug", async (req, res) => {
  try {
    const cityId = await resolveCityId(req.params.cityKey);
    if (!cityId) return res.status(404).json({ error: "Microlocation not found" });
    const micro = await Microlocation.findOne({
      city: cityId,
      slug: String(req.params.microSlug).toLowerCase(),
      isDeleted: false,
    }).populate("city", "city displayCity state");
    if (!micro) return res.status(404).json({ error: "Microlocation not found" });
    return res.json(micro);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const cityKey = req.body.city;
    if (!name || !cityKey) return res.status(400).json({ error: "Name and city are required" });

    const cityId = await resolveCityId(cityKey);
    if (!cityId) return res.status(400).json({ error: "Invalid city" });

    const slug = slugify(name);
    const exists = await Microlocation.findOne({ city: cityId, slug }).select("_id").lean();
    if (exists) return res.status(409).json({ error: "Microlocation already exists for this city" });

    const micro = await Microlocation.create({
      name,
      slug,
      city: cityId,
      footerTitle: req.body.footerTitle,
      footerDescription: req.body.footerDescription,
      metaTitle: req.body.metaTitle,
      metaDescription: req.body.metaDescription,
      schemaMarkup: req.body.schemaMarkup,
    });

    return res.status(201).json({ success: true, micro });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: "Microlocation already exists for this city" });
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/microlocations/:id  { name?, city?, ...seo, enabled?, isDeleted? }
router.patch("/:id", async (req, res) => {
  try {
    const micro = await Microlocation.findById(req.params.id);
    if (!micro) return res.status(404).json({ error: "Not found" });

    if (typeof req.body.name === "string" && req.body.name.trim()) {
      const nextSlug = slugify(req.body.name);
      if (String(nextSlug) !== micro.slug || (req.body.city && req.body.city !== micro.city.toString())) {
        const nextCityId = req.body.city ? await resolveCityId(req.body.city) : micro.city;
        if (!nextCityId) return res.status(400).json({ error: "Invalid city" });
        const dup = await Microlocation.findOne({
          _id: { $ne: micro._id },
          city: nextCityId,
          slug: nextSlug,
        }).select("_id");
        if (dup) return res.status(409).json({ error: "Microlocation already exists for this city" });
        micro.slug = nextSlug;
        micro.name = req.body.name.trim();
        micro.city = nextCityId;
      }
    } else if (typeof req.body.city !== "undefined") {
      const nextCityId = await resolveCityId(req.body.city);
      if (!nextCityId) return res.status(400).json({ error: "Invalid city" });
      micro.city = nextCityId;
    }

    // optional flags and SEO
    ["enabled", "isDeleted", "footerTitle", "footerDescription", "metaTitle", "metaDescription", "schemaMarkup"]
      .forEach((k) => {
        if (typeof req.body[k] !== "undefined") micro[k] = req.body[k];
      });

    await micro.save();
    return res.json({ success: true, micro });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: "Microlocation already exists for this city" });
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/microlocations/:id
router.delete("/:id", async (req, res) => {
  try {
    const del = await Microlocation.deleteOne({ _id: req.params.id });
    return res.json({ success: true, deletedCount: del.deletedCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
