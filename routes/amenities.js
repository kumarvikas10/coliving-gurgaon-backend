const express = require("express");
const router = express.Router();
const Amenity = require("../models/Amenity");
const upload = require("../middleware/upload");
const cloudinary = require("../utils/cloudinary");

router.post("/", upload.single("icon"), async (req, res, next) => {
    try {
        const { name, enabled = true } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: "name is required" });
        }

        let iconMeta;
        if (req.file?.buffer) {
            const isSvg =
                req.file.mimetype === "image/svg+xml" ||
                /\.svg$/i.test(req.file.originalname || "");
            const options = isSvg
                ? {
                    folder: "coliving/amenities",
                    resource_type: "image",
                    // preserve vector; do not set quality/auto format
                    format: "svg",
                }
                : {
                    folder: "coliving/amenities",
                    resource_type: "image",
                    format: "webp",
                    quality: "auto:eco",
                    transformation: [{ fetch_format: "auto", quality: "auto" }],
                };

            const up = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(options, (err, result) =>
                    err ? reject(err) : resolve(result)
                ).end(req.file.buffer);
            });

            iconMeta = {
                publicId: up.public_id,
                secureUrl: up.secure_url,
                bytes: up.bytes,
                format: up.format,     
                width: up.width, 
                height: up.height,   
            };
        }


        const created = await Amenity.create({
            name: name.trim(),
            enabled: String(enabled) === "false" ? false : true,
            icon: iconMeta,
        });
        return res.status(201).json({ success: true, data: created });
    } catch (e) {
        return next(e);
    }
});

// List amenities
router.get("/", async (req, res, next) => {
    try {
        const includeAll = String(req.query.all || "false").toLowerCase() === "true";
        const includeDeleted = String(req.query.deleted || "false").toLowerCase() === "true";
        const filter = {};
        if (!includeAll) filter.enabled = true;
        if (!includeDeleted) filter.isDeleted = false;
        const items = await Amenity.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, count: items.length, data: items });
    } catch (e) { next(e); }
});

// Get by id
router.get("/:id", async (req, res, next) => {
    try {
        const amenity = await Amenity.findById(req.params.id);
        if (!amenity || amenity.isDeleted) {
            return res.status(404).json({ success: false, message: "Not found" });
        }
        res.json({ success: true, data: amenity });
    } catch (e) { next(e); }
});

// Update (multipart/form-data; field: icon)
router.put("/:id", upload.single("icon"), async (req, res, next) => {
    try {
        const amenity = await Amenity.findById(req.params.id);
        if (!amenity || amenity.isDeleted) {
            return res.status(404).json({ success: false, message: "Not found" });
        }

        const updates = {};
        if (typeof req.body.name === "string") updates.name = req.body.name.trim();
        if (typeof req.body.enabled !== "undefined") {
            updates.enabled = req.body.enabled === "true" || req.body.enabled === true;
        }

        if (req.file?.buffer) {
            // Delete old icon first (best-effort) then upload new
            if (amenity.icon?.publicId) {
                try { await cloudinary.uploader.destroy(amenity.icon.publicId, { resource_type: "image" }); } catch (_) { }
            }
            const up = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { folder: "coliving/amenities", resource_type: "image", format: "webp", quality: "auto:eco", transformation: [{ fetch_format: "auto", quality: "auto" }] },
                    (err, result) => err ? reject(err) : resolve(result)
                ).end(req.file.buffer);
            });
            updates.icon = {
                publicId: up.public_id,
                secureUrl: up.secure_url,
                bytes: up.bytes,
                format: up.format,
                width: up.width,
                height: up.height,
            };
        }

        const updated = await Amenity.findByIdAndUpdate(amenity._id, { $set: updates }, { new: true, runValidators: true });
        res.json({ success: true, data: updated });
    } catch (e) { next(e); }
});

// Toggle enable/disable
router.patch("/:id/enable", async (req, res, next) => {
    try {
        if (typeof req.body.enabled === "undefined") {
            return res.status(400).json({ success: false, message: "enabled is required" });
        }
        const updated = await Amenity.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { $set: { enabled: !!req.body.enabled } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: updated });
    } catch (e) { next(e); }
});

// Delete (soft by default; hard=true destroys icon)
router.delete("/:id", async (req, res, next) => {
    try {
        const hard = String(req.query.hard || "false").toLowerCase() === "true";
        const amenity = await Amenity.findById(req.params.id);
        if (!amenity) return res.json({ success: true, message: "Already deleted" });

        if (hard) {
            if (amenity.icon?.publicId) {
                try { await cloudinary.uploader.destroy(amenity.icon.publicId, { resource_type: "image" }); } catch (_) { }
            }
            await Amenity.deleteOne({ _id: amenity._id });
            return res.json({ success: true, message: "Amenity permanently deleted" });
        }

        const updated = await Amenity.findByIdAndUpdate(
            amenity._id,
            { $set: { isDeleted: true, enabled: false } },
            { new: true }
        );
        res.json({ success: true, message: "Amenity deleted", data: updated });
    } catch (e) { next(e); }
});

module.exports = router;
