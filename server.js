const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));


// Routes
app.use('/api/admin', require('./routes/admin'));

const statesRouter = require("./routes/states");
app.use("/api/states", statesRouter);

const citiesRouter = require("./routes/cities");
app.use("/api/cities", citiesRouter);

const microRoutes = require('./routes/microlocations');
app.use('/api/microlocations', microRoutes);


const mediaRoutes = require('./routes/media');
app.use('/api/media', mediaRoutes);

const portfolioRoutes = require('./routes/portfolio');
app.use('/api/portfolio', portfolioRoutes);

const colivingPlansRouter = require("./routes/colivingPlans");
app.use("/api/plans", colivingPlansRouter);

const amenitiesRouter = require("./routes/amenities");
app.use("/api/amenities", amenitiesRouter);

const propertiesRouter = require("./routes/properties");
app.use("/api/properties", propertiesRouter);

const leadsRouter = require('./routes/leads');
app.use('/api/leads', leadsRouter);

// 404 (optional, helps debugging)
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error("ERROR:", err?.stack || err);
  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});


app.get('/', (req, res) => {
  res.send('Coliving Gurgaon API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
