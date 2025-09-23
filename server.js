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


// // Routes
// app.use('/api/admin', require('./routes/admin'));
// app.use('/api/cities', require('./routes/cities'));

// const mediaRoutes = require('./routes/media');
// app.use('/api/media', mediaRoutes);

// const portfolioRoutes = require('./routes/portfolio');
// app.use('/api/portfolio', portfolioRoutes);

app.get('/', (req, res) => {
  res.send('Coliving Gurgaon API is running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
