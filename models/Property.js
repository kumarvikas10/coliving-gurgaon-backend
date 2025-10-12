// models/Property.js
const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, trim: true },
    secureUrl: { type: String, required: true, trim: true },
    bytes: { type: Number },
    format: { type: String },
    width: { type: Number },
    height: { type: Number },
    order: { type: Number, default: 0 },
    alt: { type: String, trim: true, default: "" },
  },
  { _id: true, timestamps: false }
);

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    show_on_website: { type: Boolean, default: true },
  },
  { _id: false }
);

const MetroDetailSchema = new mongoose.Schema(
  {
    is_near_metro: { type: Boolean, default: false },
    station_name: { type: String, trim: true, default: "" },
    distance_km: { type: Number, default: 0 },
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "CityContent", required: false },
    state: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    location_slug: { type: String, trim: true, index: true },
    metro_detail: { type: MetroDetailSchema, default: () => ({}) },
    micro_locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Microlocation" }],
    nearby_places: [
      {
        name: { type: String, trim: true },
        distance: { type: String, trim: true },
        type: { type: String, trim: true },
      },
    ],
  },
  { _id: false }
);

const TwitterSeoSchema = new mongoose.Schema(
  {
    image: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const OpenGraphSeoSchema = new mongoose.Schema(
  {
    image: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const SeoSchema = new mongoose.Schema(
  {
    status: { type: Boolean, default: true },
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    keywords: [{ type: String, trim: true }],
    robots: { type: String, trim: true, default: "index, follow" },
    twitter: { type: TwitterSeoSchema, default: () => ({}) },
    open_graph: { type: OpenGraphSeoSchema, default: () => ({}) },
  },
  { _id: false }
);

const OtherDetailSchema = new mongoose.Schema(
  {
    breakfast: { is_include: { type: Boolean, default: false }, price: { type: Number, default: 0 } },
    lunch: { is_include: { type: Boolean, default: false }, price: { type: Number, default: 0 } },
    dinner: { is_include: { type: Boolean, default: false }, price: { type: Number, default: 0 } },
    is_electricity_bill_included: { type: Boolean, default: false },
    beds: { type: Number, default: 0 },
    rent_per_bed: { type: Number, default: 0 },
    food_and_beverage: { type: String, trim: true, default: "" },
    type_of_co_living: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const PlanPriceSchema = new mongoose.Schema(
  {
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "ColivingPlan", required: true },
    price: { type: Number, required: true },
    duration: { type: String, trim: true, default: "month" },
  },
  { _id: true }
);

const PropertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: "" },
    tags: [{ type: String, trim: true }],
    images: { type: [ImageSchema], default: [] },
    space_contact_details: { type: ContactSchema, default: () => ({}) },
    location: { type: LocationSchema, default: () => ({}) },
    amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Amenity" }],
    coliving_plans: { type: [PlanPriceSchema], default: [] },
    startingPrice: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    seo: { type: SeoSchema, default: () => ({}) },
    other_detail: { type: OtherDetailSchema, default: () => ({}) },
    space_type: { type: String, trim: true, default: "co-living" },
    status: { type: String, enum: ["draft", "pending", "approved", "rejected", "archived"], default: "pending" },
    featured: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// compute startingPrice from coliving_plans if not provided
PropertySchema.pre("save", function (next) {
  if ((!this.startingPrice || this.startingPrice <= 0) && Array.isArray(this.coliving_plans) && this.coliving_plans.length) {
    const min = Math.min(...this.coliving_plans.map((p) => p.price).filter((n) => typeof n === "number"));
    if (Number.isFinite(min)) this.startingPrice = min;
  }
  next();
});

module.exports = mongoose.model("Property", PropertySchema);
