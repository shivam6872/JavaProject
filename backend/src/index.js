require('dotenv').config();
const express = require('express');
const cors = require('cors');

const path = require('path');

const employeeRoutes = require('./routes/employees');
const managerRoutes = require('./routes/managers');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../../frontend')));


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const authRoutes = require('./routes/auth');

app.use('/api/employees', employeeRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server Error' });
});

app.listen(PORT, () => {
  console.log(`EvalX API listening on http://localhost:${PORT}`);
});



