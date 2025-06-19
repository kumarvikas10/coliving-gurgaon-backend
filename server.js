// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Import routes
const cityContentRoutes = require('./routes/cityContentRoutes');
app.use('/api/cities', cityContentRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


