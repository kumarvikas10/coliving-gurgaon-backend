// routes/admin-cities.js
const express = require("express");
const router = express.Router();
const CityContent = require("../models/CityContent");
const State = require("../models/State");

const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const resolveStateId = async (v) => {
  if (!v) return null;
  const isId = /^[0-9a-fA-F]{24}$/.test(String(v));
  if (isId) {
    const st = await State.findById(v).select("_id").lean();
    return st?._id || null;
  }
  const st = await State.findOne({ state: String(v).toLowerCase() }).select("_id").lean();
  return st?._id || null;
};

// POST /api/admin/cities
router.post("/", async (req, res) => {
  try {
    const raw = String(req.body.city || "").trim();
    const stateIn = req.body.state;
    if (!raw || !stateIn) return res.status(400).json({ error: "city and state are required" });
    const stateId = await resolveStateId(stateIn);
    if (!stateId) return res.status(400).json({ error: "Invalid state" });

    const city = slugify(raw);
    const dup = await CityContent.findOne({ city }).select("_id").lean();
    if (dup) return res.status(409).json({ error: "City already exists" });

    const created = await CityContent.create({
      city,
      displayCity: raw,
      state: stateId,
    });
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "City already exists" });
    if (e?.name === "ValidationError") return res.status(400).json({ error: e.message });
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/admin/cities/:city
router.put("/:city", async (req, res) => {
  try {
    const cur = await CityContent.findOne({ city: String(req.params.city).toLowerCase() });
    if (!cur) return res.status(404).json({ error: "Not found" });

    if (typeof req.body.newCity === "string" && req.body.newCity.trim()) {
      const nextSlug = slugify(req.body.newCity);
      if (nextSlug !== cur.city) {
        const dup = await CityContent.findOne({ city: nextSlug, _id: { $ne: cur._id } }).select("_id");
        if (dup) return res.status(409).json({ error: "City already exists" });
        cur.city = nextSlug;
        cur.displayCity = req.body.newCity.trim();
      }
    }

    if (typeof req.body.state !== "undefined") {
      const stateId = await resolveStateId(req.body.state);
      if (!stateId) return res.status(400).json({ error: "Invalid state" });
      cur.state = stateId;
    }

    await cur.save();
    res.json({ success: true, data: cur });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "City already exists" });
    if (e?.name === "ValidationError") return res.status(400).json({ error: e.message });
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/cities/:city
router.delete("/:city", async (req, res) => {
  try {
    const del = await CityContent.deleteOne({ city: String(req.params.city).toLowerCase() });
    res.json({ success: true, deletedCount: del.deletedCount });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
