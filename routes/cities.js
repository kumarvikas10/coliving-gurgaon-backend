// routes/cities.js
const express = require("express");
const CityContent = require("../models/CityContent");
const State = require("../models/State");

// helpers
const slugify = (s) =>
  String(s || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

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

// PUBLIC
const publicRouter = express.Router();
publicRouter.get("/ping", (req, res) => res.json({ ok: true }));
publicRouter.get("/", async (req, res) => {
  try {
    const { state, withState } = req.query;
    const filter = {};
    if (state) {
      const isId = /^[0-9a-fA-F]{24}$/.test(String(state));
      if (isId) filter.state = state;
      else {
        const s = await State.findOne({ state: String(state).toLowerCase() }).select("_id").lean();
        if (!s) return res.json([]);
        filter.state = s._id;
      }
    }
    let q = CityContent.find(filter).sort({ displayCity: 1 });
    const projection = withState === "true" ? "city displayCity state" : "city";
    q = q.select(projection);
    if (withState === "true") q = q.populate("state", "displayState state");
    res.json(await q.lean());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});
publicRouter.get("/:city", async (req, res) => {
  try {
    const row = await CityContent.findOne({ city: String(req.params.city).toLowerCase() })
      .populate("state", "displayState state")
      .lean();
    if (!row) return res.status(404).json({ error: "City not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ADMIN
const adminRouter = express.Router();
adminRouter.post("/", async (req, res) => {
  try {
    console.log("ADMIN /cities POST body:", req.body); // debug once
    const raw = String(req.body.city || "").trim();
    const stateIn = req.body.state;
    if (!raw || !stateIn) return res.status(400).json({ error: "city and state are required" });

    const stateId = await resolveStateId(stateIn);
    if (!stateId) return res.status(400).json({ error: "Invalid state" });

    const city = slugify(raw);
    const dup = await CityContent.findOne({ city }).select("_id").lean();
    if (dup) return res.status(409).json({ error: "City already exists" });

    const created = await CityContent.create({ city, displayCity: raw, state: stateId });
    return res.status(201).json({ success: true, data: created });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "City already exists" });
    if (e?.name === "ValidationError") return res.status(400).json({ error: e.message });
    if (e?.name === "CastError") return res.status(400).json({ error: "Invalid ObjectId" });
    console.error("ADMIN /cities create error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});


adminRouter.put("/:city", async (req, res) => {
  try {
    const cur = await CityContent.findOne({ city: String(req.params.city).toLowerCase() });
    if (!cur) return res.status(404).json({ error: "Not found" });
    if (typeof req.body.newCity === "string" && req.body.newCity.trim()) {
      const nextSlug = slugify(req.body.newCity);
      if (nextSlug !== cur.city) {
        const dup = await CityContent.findOne({ city: nextSlug, _id: { $ne: cur._id } }).select("_id").lean();
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
adminRouter.delete("/:city", async (req, res) => {
  try {
    const del = await CityContent.deleteOne({ city: String(req.params.city).toLowerCase() });
    res.json({ success: true, deletedCount: del.deletedCount });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = { publicRouter, adminRouter };
