// scripts/backfill-city-states.js
const mongoose = require("mongoose");
const CityContent = require("../models/CityContent");
const State = require("../models/State");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // map city slug -> state slug (extend as needed)
  const map = new Map([
    ["gurgaon", "haryana"],
    ["mumbai", "maharashtra"],
    ["delhi", "delhi"],
  ]);

  for (const [citySlug, stateSlug] of map) {
    const st = await State.findOne({ state: stateSlug }).lean();
    if (!st) {
      console.warn("Missing state:", stateSlug);
      continue;
    }
    const upd = await CityContent.updateMany({ city: citySlug }, { $set: { state: st._id } });
    console.log(citySlug, "->", stateSlug, "updated:", upd.modifiedCount);
  }

  await mongoose.disconnect();
})();
