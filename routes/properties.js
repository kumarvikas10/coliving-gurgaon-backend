const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const CityContent = require("../models/CityContent");       // NEW
const Microlocation = require("../models/Microlocation");   // NEW
const upload = require("../middleware/upload");
const cloudinary = require("../utils/cloudinary");

// helper: upload one buffer to Cloudinary via upload_stream
function uploadOne(buffer, isSvg, folder = "coliving/properties") {
  return new Promise((resolve, reject) => {
    const options = isSvg
      ? { folder, resource_type: "image", format: "svg" }
      : {
        folder,
        resource_type: "image",
        format: "webp",
        quality: "auto:eco",
        transformation: [{ fetch_format: "auto", quality: "auto" }],
      };
    cloudinary.uploader.upload_stream(options, (err, result) => (err ? reject(err) : resolve(result))).end(buffer);
  });
}

// helper: map upload result to image schema
const toImageDoc = (up, order = 0, alt = "") => ({
  publicId: up.public_id,
  secureUrl: up.secure_url,
  bytes: up.bytes,
  format: up.format,
  width: up.width,
  height: up.height,
  order,
  alt,
});


router.get("/", async (req, res, next) => {
  try {
    const { city, status, featured, search, micro, all = "true", deleted = "false" } = req.query;

    const filter = {};
    if (deleted !== "true") filter.isDeleted = false;
    if (all !== "true") filter.status = "approved";
    if (city) filter["location.city"] = city;                 // client sends stored id (or slug if you decide so)
    if (status) filter.status = status;
    if (featured === "true") filter.featured = true;
    if (micro) filter["location.micro_locations"] = micro;
    if (search) filter.name = new RegExp(String(search).trim(), "i");

    // Fetch raw properties first (lean for speed)
    const docs = await Property.find(filter).select("-__v").sort({ createdAt: -1 }).lean();

    // Load reference data once
    const [cityRows, microRows] = await Promise.all([
      CityContent.find({}, { _id: 1, city: 1, displayCity: 1 }).lean(),
      Microlocation.find({}, { _id: 1, name: 1, slug: 1, city: 1 }).lean()
    ]);

    const cityById = new Map(cityRows.map(c => [String(c._id), { name: c.displayCity || c.city, slug: c.city }]));
    const cityBySlug = new Map(cityRows.map(c => [String(c.city), { name: c.displayCity || c.city, slug: c.city }]));
    const microById = new Map(microRows.map(m => [String(m._id), { name: m.name, slug: m.slug, city: m.city }]));

    // Hydrate names into response (non-destructive: preserve ids)
    const withNames = docs.map(d => {
      const out = { ...d };
      const loc = { ...(d.location || {}) };

      // City: support either ObjectId string or slug stored in location.city
      const rawCity = loc.city;
      if (rawCity != null) {
        const key = String(rawCity);
        const cityMeta = cityById.get(key) || cityBySlug.get(key);
        loc.city = cityMeta
          ? { _id: key, name: cityMeta.name, slug: cityMeta.slug }
          : { _id: key, name: key };
      }

      // Microlocations: stored as ObjectId array referencing Microlocation
      const rawMicros = Array.isArray(loc.micro_locations) ? loc.micro_locations : [];
      loc.micro_locations = rawMicros.map(id => {
        const key = String(id);
        const meta = microById.get(key);
        return meta ? { _id: key, name: meta.name, slug: meta.slug } : { _id: key, name: key };
      });

      out.location = loc;
      return out;
    });

    res.json({ success: true, count: withNames.length, data: withNames });
  } catch (e) {
    next(e);
  }
});

// GET /api/properties/slug/:slug
router.get("/slug/:slug", async (req, res, next) => {
  try {
    const doc = await Property.findOne({ slug: req.params.slug, isDeleted: false }).lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (e) { next(e); }
});


// GET /api/properties/:id
router.get("/:id", async (req, res, next) => {
  console.log("[GET /api/properties/:id]", req.params.id);
  try {
    const includeDeleted = String(req.query.deleted || "true").toLowerCase() === "true"; // allow by default for admin
    const d = await Property.findById(req.params.id).lean();
    if (!d) return res.status(404).json({ success: false, message: "Not found" });
    if (!includeDeleted && d.isDeleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // enrichment (same as your list):
    const [cityRows, microRows] = await Promise.all([
      CityContent.find({}, { _id: 1, city: 1, displayCity: 1 }).lean(),
      Microlocation.find({}, { _id: 1, name: 1, slug: 1, city: 1 }).lean()
    ]);
    const cityById = new Map(cityRows.map(c => [String(c._id), { name: c.displayCity || c.city, slug: c.city }]));
    const cityBySlug = new Map(cityRows.map(c => [String(c.city), { name: c.displayCity || c.city, slug: c.city }]));
    const microById = new Map(microRows.map(m => [String(m._id), { name: m.name, slug: m.slug, city: m.city }]));

    const out = { ...d };
    const loc = { ...(d.location || {}) };

    const rawCity = loc.city;
    if (rawCity != null) {
      const key = String(rawCity);
      const meta = cityById.get(key) || cityBySlug.get(key);
      loc.city = meta ? { _id: key, name: meta.name, slug: meta.slug } : { _id: key, name: key };
    }

    const rawMicros = Array.isArray(loc.micro_locations) ? loc.micro_locations : [];
    loc.micro_locations = rawMicros.map(id => {
      const key = String(id);
      const meta = microById.get(key);
      return meta ? { _id: key, name: meta.name, slug: meta.slug } : { _id: key, name: key };
    });

    out.location = loc;
    res.json({ success: true, data: out });
  } catch (e) { next(e); }
});


router.post("/", upload.array("images", 20), async (req, res, next) => {
  try {
    // parse primitives and JSON fields from form-data
    const parseJSON = (field, def = null) => {
      if (!req.body[field]) return def;
      try { return JSON.parse(req.body[field]); } catch { return req.body[field]; }
    };

    // required: name and slug
    const name = (req.body.name || "").trim();
    const slug = (req.body.slug || "").trim();
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: "name and slug are required" });
    }

    const space_contact_details = parseJSON("space_contact_details", {});
    const location = parseJSON("location", {});
    const amenities = parseJSON("amenities", []);
    const coliving_plans = parseJSON("coliving_plans", []);
    const seo = parseJSON("seo", {});
    const other_detail = parseJSON("other_detail", {});
    const tags = parseJSON("tags", []);
    const startingPrice = Number(req.body.startingPrice || 0);
    const rating = Number(req.body.rating || 0);
    const reviewCount = Number(req.body.reviewCount || 0);
    const status = (req.body.status || "pending").trim();
    const featured = String(req.body.featured || "false") === "true";
    const verified = String(req.body.verified || "false") === "true";
    const space_type = (req.body.space_type || "co-living").trim();
    const description = req.body.description || "";

    // images
    let images = [];
    if (Array.isArray(req.files) && req.files.length) {
      let order = 0;
      for (const f of req.files) {
        const isSvg = f.mimetype === "image/svg+xml" || /\.svg$/i.test(f.originalname || "");
        const up = await uploadOne(f.buffer, isSvg, "coliving/properties");
        images.push(toImageDoc(up, order++, ""));
      }
    }

    const created = await Property.create({
      name,
      slug,
      description,
      tags,
      images,
      space_contact_details,
      location,
      amenities,
      coliving_plans,
      startingPrice,
      rating,
      reviewCount,
      seo,
      other_detail,
      space_type,
      status,
      featured,
      verified,
    });
    res.status(201).json({ success: true, data: created });

    // routes/properties.js - POST route, add after parseJSON calls:
    console.log("POST /api/properties payload:", {
      name, slug,
      location: location?.city ? `city=${location.city}` : "no city",
      amenities: Array.isArray(amenities) ? `${amenities.length} items` : "not array",
      coliving_plans: Array.isArray(coliving_plans) ? `${coliving_plans.length} plans` : "not array"
    });

    // Also sanitize IDs before Property.create:
    const cleanObjectId = (v) => (typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v) ? v : undefined);

    if (location?.city) {
      location.city = cleanObjectId(location.city);
      if (!location.city) {
        return res.status(400).json({ success: false, message: "Invalid city ID" });
      }
    }

    // Sanitize amenities array
    const safeAmenities = Array.isArray(amenities)
      ? amenities.map(String).filter(id => /^[0-9a-fA-F]{24}$/.test(id))
      : [];

    // Sanitize coliving_plans
    const safePlans = Array.isArray(coliving_plans)
      ? coliving_plans
        .map(p => ({
          plan: cleanObjectId(typeof p?.plan === "object" ? p.plan?._id : p?.plan),
          price: Number(p?.price),
          duration: p?.duration || "month"
        }))
        .filter(p => p.plan && Number.isFinite(p.price))
      : [];

  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ success: false, message: "Slug already exists" });
    }
    if (e?.name === "CastError" || e?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: e.message });
    }
    return next(e);
  }
});


// PUT /api/properties/:id
router.put("/:id", upload.array("images", 20), async (req, res, next) => {
  try {
    const prop = await Property.findById(req.params.id);
    // Allow editing archived; remove the isDeleted block
    if (!prop) return res.status(404).json({ success: false, message: "Not found" });

    const parseJSON = (field) => {
      if (typeof req.body[field] === "undefined") return undefined;
      try { return JSON.parse(req.body[field]); } catch { return req.body[field]; }
    };

    // Collect scalar and JSON updates
    const set = {};
    ["name", "slug", "description", "space_type", "status"].forEach((k) => {
      if (typeof req.body[k] === "string") set[k] = req.body[k].trim();
    });
    if (typeof req.body.startingPrice !== "undefined") set.startingPrice = Number(req.body.startingPrice);
    if (typeof req.body.rating !== "undefined") set.rating = Number(req.body.rating);
    if (typeof req.body.reviewCount !== "undefined") set.reviewCount = Number(req.body.reviewCount);
    if (typeof req.body.featured !== "undefined") set.featured = String(req.body.featured) === "true" || req.body.featured === true;
    if (typeof req.body.verified !== "undefined") set.verified = String(req.body.verified) === "true" || req.body.verified === true;

    ["space_contact_details", "location", "amenities", "coliving_plans", "seo", "other_detail", "tags"].forEach((f) => {
      const v = parseJSON(f);
      if (typeof v !== "undefined") set[f] = v;
    });

    // Recompute startingPrice from new/old plans
    const nextPlans = Array.isArray(set.coliving_plans) ? set.coliving_plans : prop.coliving_plans;
    const prices = (nextPlans || []).map(p => Number(p.price)).filter(n => Number.isFinite(n) && n > 0);
    set.startingPrice = prices.length ? Math.min(...prices) : 0;

    // Optional image append
    const ops = { $set: set };
    if (Array.isArray(req.files) && req.files.length) {
      let maxOrder = prop.images.length ? Math.max(...prop.images.map(i => i.order || 0)) : -1;
      const appended = [];
      for (const f of req.files) {
        const isSvg = f.mimetype === "image/svg+xml" || /\.svg$/i.test(f.originalname || "");
        const up = await uploadOne(f.buffer, isSvg, "coliving/properties");
        appended.push(toImageDoc(up, ++maxOrder, ""));
      }
      ops.$push = { images: { $each: appended } };
    }

    const updated = await Property.findByIdAndUpdate(prop._id, ops, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});


// PATCH /api/properties/:id/status  body: { status }
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const ok = ["draft", "pending", "approved", "rejected", "archived"].includes(String(status));
    if (!ok) return res.status(400).json({ success: false, message: "invalid status" });
    const updated = await Property.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { status: String(status) } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// PATCH /api/properties/:id/feature  body: { featured: boolean }
router.patch("/:id/feature", async (req, res, next) => {
  try {
    if (typeof req.body.featured === "undefined") {
      return res.status(400).json({ success: false, message: "featured is required" });
    }
    const updated = await Property.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { featured: !!req.body.featured } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// POST /api/properties/:id/images/reorder  body: { orders: [{imageId, order}] }
router.post("/:id/images/reorder", async (req, res, next) => {
  try {
    const { orders } = req.body;
    const prop = await Property.findById(req.params.id);
    if (!prop || prop.isDeleted) return res.status(404).json({ success: false, message: "Not found" });
    const map = new Map(orders.map((o) => [String(o.imageId), Number(o.order)]));
    prop.images.forEach((img) => {
      const n = map.get(String(img._id));
      if (Number.isFinite(n)) img.order = n;
    });
    await prop.save();
    res.json({ success: true, data: prop });
  } catch (e) { next(e); }
});

// DELETE /api/properties/:id/images/:imageId  (delete one image and Cloudinary asset)
router.delete("/:id/images/:imageId", async (req, res, next) => {
  try {
    const prop = await Property.findById(req.params.id);
    if (!prop || prop.isDeleted) return res.status(404).json({ success: false, message: "Not found" });
    const img = prop.images.id(req.params.imageId);
    if (!img) return res.status(404).json({ success: false, message: "Image not found" });
    try { await cloudinary.uploader.destroy(img.publicId, { resource_type: "image" }); } catch (_) { }
    img.deleteOne();
    await prop.save();
    res.json({ success: true, message: "Image removed", data: prop });
  } catch (e) { next(e); }
});

// DELETE /api/properties/:id  (soft by default; ?hard=true destroys images then removes doc)
router.delete("/:id", async (req, res, next) => {
  try {
    const hard = String(req.query.hard || "false").toLowerCase() === "true";
    const prop = await Property.findById(req.params.id);
    if (!prop) return res.json({ success: true, message: "Already deleted" });

    if (hard) {
      for (const img of prop.images) {
        try { await cloudinary.uploader.destroy(img.publicId, { resource_type: "image" }); } catch (_) { }
      }
      await Property.deleteOne({ _id: prop._id });
      return res.json({ success: true, message: "Property permanently deleted" });
    }

    prop.isDeleted = true;
    prop.status = "archived";
    await prop.save();
    res.json({ success: true, message: "Property deleted", data: prop });
  } catch (e) { next(e); }
});

module.exports = router;
