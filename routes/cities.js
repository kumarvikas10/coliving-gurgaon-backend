// routes/cities.js
const express = require("express");
const router = express.Router();
const CityContent = require("../models/CityContent");
const State = require("../models/State"); // NEW

// GET /api/cities?state=<id-or-slug>&withState=true
router.get("/", async (req, res) => {
  try {
    const { state, withState } = req.query;

    // Build filter (optionally by state id or slug)
    const filter = {};
    if (state) {
      const isId = /^[0-9a-fA-F]{24}$/.test(String(state));
      if (isId) {
        filter.state = state;
      } else {
        const s = await State.findOne({ state: String(state).toLowerCase() }).select("_id").lean();
        if (!s) return res.json([]); // unknown state -> empty list
        filter.state = s._id;
      }
    }

    // Base query and projection remain lightweight by default
    let q = CityContent.find(filter).sort({ displayCity: 1 });
    const project = withState === "true" ? "city displayCity state" : "city";
    q = q.select(project);

    // Populate state only when requested
    if (withState === "true") {
      q = q.populate("state", "displayState state");
    }

    const rows = await q.lean();
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/cities/:city  (returns full doc with state populated)
router.get("/:city", async (req, res) => {
  const { city } = req.params;
  try {
    const row = await CityContent.findOne({ city: String(city).toLowerCase() })
      .populate("state", "displayState state")
      .lean();
    if (!row) return res.status(404).json({ error: "City not found" });
    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
