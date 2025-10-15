// routes/states.js
const express = require("express");
const router = express.Router();
const State = require("../models/State");

// GET /api/states?enabled=true&search=guj
router.get("/", async (req, res) => {
  try {
    const { enabled, search } = req.query;
    const filter = {};
    if (typeof enabled !== "undefined") filter.enabled = String(enabled) === "true";
    if (search) {
      const s = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { displayState: { $regex: s, $options: "i" } },
        { state: { $regex: s, $options: "i" } },
      ];
    }
    const rows = await State.find(filter).sort({ order: 1, displayState: 1 }).lean();
    res.json(rows); // keep same simple array style as your cities route
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/states/:key (accepts ObjectId or slug)
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const isId = /^[0-9a-fA-F]{24}$/.test(key);
    const row = await State.findOne(isId ? { _id: key } : { state: key.toLowerCase() }).lean();
    if (!row) return res.status(404).json({ error: "State not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/states  body: { state, displayState, enabled?, order?, country? }
router.post("/", async (req, res) => {
  try {
    const state = String(req.body.state || "").trim().toLowerCase();
    const displayState = String(req.body.displayState || "").trim();
    if (!state || !displayState) {
      return res.status(400).json({ error: "state and displayState are required" });
    }
    const dup = await State.findOne({
      $or: [{ state }, { displayState: { $regex: `^${displayState}$`, $options: "i" } }],
    });
    if (dup) {
      const msg =
        dup.state === state
          ? "State slug already exists"
          : "State display name already exists";
      return res.status(409).json({ error: msg });
    }
    const created = await State.create({
      state,
      displayState,
      enabled: req.body.enabled ?? true,
      order: Number(req.body.order || 0),
      country: req.body.country || "India",
    });
    res.status(201).json(created);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "State slug already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/states/:id
router.put("/:id", async (req, res) => {
  try {
    const cur = await State.findById(req.params.id);
    if (!cur) return res.status(404).json({ error: "Not found" });

    const nextState =
      typeof req.body.state === "string" ? req.body.state.trim().toLowerCase() : cur.state;
    const nextDisplay =
      typeof req.body.displayState === "string" ? req.body.displayState.trim() : cur.displayState;

    if (!nextState || !nextDisplay) {
      return res.status(400).json({ error: "state and displayState are required" });
    }

    const dup = await State.findOne({
      _id: { $ne: cur._id },
      $or: [{ state: nextState }, { displayState: { $regex: `^${nextDisplay}$`, $options: "i" } }],
    });
    if (dup) {
      const msg =
        dup.state === nextState
          ? "State slug already exists"
          : "State display name already exists";
      return res.status(409).json({ error: msg });
    }

    cur.state = nextState;
    cur.displayState = nextDisplay;
    if (typeof req.body.enabled !== "undefined") cur.enabled = !!req.body.enabled;
    if (typeof req.body.order !== "undefined") cur.order = Number(req.body.order);
    if (typeof req.body.country === "string") cur.country = req.body.country;
    await cur.save();
    res.json(cur);
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "State slug already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/states/:id (hard delete)
router.delete("/:id", async (req, res) => {
  try {
    const del = await State.deleteOne({ _id: req.params.id });
    res.json({ success: true, deletedCount: del.deletedCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
