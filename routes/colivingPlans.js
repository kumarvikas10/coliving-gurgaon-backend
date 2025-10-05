// routes/colivingPlans.js
const express = require("express");
const router = express.Router();
const ColivingPlan = require("../models/ColivingPlan");
const upload = require("../middleware/upload");
const cloudinary = require("../utils/cloudinary");
const { Readable } = require("stream");

// helper: pipe buffer to cloudinary upload_stream
function uploadBufferToCloudinary(buffer, folder = "plans") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });
}

router.get("/ping", (req,res)=>res.json({ok:true}));

// GET /api/plans
router.get("/", async (req, res, next) => {
  try {
    const includeAll = String(req.query.all || "false").toLowerCase() === "true";
    const includeDeleted = String(req.query.deleted || "false").toLowerCase() === "true";
    const filter = {};
    if (!includeAll) filter.enabled = true;
    if (!includeDeleted) filter.isDeleted = false;
    const plans = await ColivingPlan.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (e) { next(e); }
});

// GET /api/plans/:id
router.get("/:id", async (req, res, next) => {
  try {
    const plan = await ColivingPlan.findById(req.params.id);
    if (!plan || plan.isDeleted) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: plan });
  } catch (e) { next(e); }
});

// POST /api/plans  (multipart/form-data; field: image)
router.post("/", upload.single("image"), async (req, res, next) => {
  try {
    const { type, description = "", enabled = true } = req.body;
    if (!type?.trim()) return res.status(400).json({ success: false, message: "type is required" });

    let imageMeta;
    if (req.file?.buffer) {
      const up = await uploadBufferToCloudinary(req.file.buffer, "coliving/plans");
      imageMeta = {
        publicId: up.public_id,
        secureUrl: up.secure_url,
        bytes: up.bytes,
        format: up.format,
        width: up.width,
        height: up.height,
      };
    }

    const created = await ColivingPlan.create({
      type: type.trim(),
      description,
      enabled: String(enabled) === "false" ? false : true,
      image: imageMeta,
    });
    res.status(201).json({ success: true, data: created });
  } catch (e) { next(e); }
});

// PUT /api/plans/:id  (multipart/form-data; field: image)
router.put("/:id", upload.single("image"), async (req, res, next) => {
  try {
    const plan = await ColivingPlan.findById(req.params.id);
    if (!plan || plan.isDeleted) return res.status(404).json({ success: false, message: "Not found" });

    const updates = {};
    if (typeof req.body.type === "string") updates.type = req.body.type.trim();
    if (typeof req.body.description === "string") updates.description = req.body.description;
    if (typeof req.body.enabled !== "undefined") updates.enabled = req.body.enabled === "true" || req.body.enabled === true;

    if (req.file?.buffer) {
      // replace image: delete old then upload new
      if (plan.image?.publicId) {
        try { await cloudinary.uploader.destroy(plan.image.publicId, { resource_type: "image" }); } catch (_) {}
      }
      const up = await uploadBufferToCloudinary(req.file.buffer, "coliving/plans");
      updates.image = {
        publicId: up.public_id,
        secureUrl: up.secure_url,
        bytes: up.bytes,
        format: up.format,
        width: up.width,
        height: up.height,
      };
    }

    const updated = await ColivingPlan.findByIdAndUpdate(plan._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// PATCH /api/plans/:id/enable
router.patch("/:id/enable", async (req, res, next) => {
  try {
    if (typeof req.body.enabled === "undefined") {
      return res.status(400).json({ success: false, message: "enabled is required" });
    }
    const updated = await ColivingPlan.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { enabled: !!req.body.enabled } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
});

// DELETE /api/plans/:id  (soft delete + destroy image)
router.delete("/:id", async (req, res, next) => {
  try {
    const hard = String(req.query.hard || "false").toLowerCase() === "true";
    const plan = await ColivingPlan.findById(req.params.id);
    if (!plan) return res.json({ success: true, message: "Already deleted" });

    if (hard) {
      if (plan.image?.publicId) {
        try { await cloudinary.uploader.destroy(plan.image.publicId, { resource_type: "image" }); } catch (_) {}
      }
      await ColivingPlan.deleteOne({ _id: plan._id });
      return res.json({ success: true, message: "Plan permanently deleted" });
    }

    const updated = await ColivingPlan.findByIdAndUpdate(
      plan._id,
      { $set: { isDeleted: true, enabled: false } },
      { new: true }
    );
    res.json({ success: true, message: "Plan deleted", data: updated });
  } catch (e) { next(e); }
});

module.exports = router;
