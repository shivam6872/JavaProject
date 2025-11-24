const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(verifyToken);

router.get('/kpis', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT metric, value FROM kpis ORDER BY id`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching KPIs' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT employee_name AS name, rank_label AS rankLabel
       FROM leaderboard
       ORDER BY rank_position ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching leaderboard' });
  }
});

router.post('/export', async (req, res) => {
  res.json({ success: true, message: 'Export started', data: { timestamp: Date.now() } });
});

module.exports = router;
