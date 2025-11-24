const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(verifyToken);

// Get all managers (for employee registration) - Note: This might be redundant if auth.js handles it, but keeping for compatibility
router.get('/', async (req, res) => {
  try {
    const [managers] = await pool.query(
      'SELECT id, name, department FROM managers ORDER BY name'
    );
    res.json({ success: true, data: managers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching managers' });
  }
});

router.get('/:id/evaluations', async (req, res) => {
  const managerId = Number(req.params.id);
  if (Number.isNaN(managerId)) return res.status(400).json({ success: false, message: 'Invalid manager id' });

  try {
    const [employees] = await pool.query(
      `SELECT e.id, e.name, e.title, e.avatar, 
              COALESCE(e.productivity, 0) as productivity, 
              COALESCE(e.teamwork, 0) as teamwork, 
              COALESCE(e.creativity, 0) as creativity
       FROM employees e
       WHERE e.manager_id = ?
       ORDER BY e.name`,
      [managerId]
    );
    res.json({ success: true, data: employees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching evaluations' });
  }
});

router.post('/:id/evaluations', async (req, res) => {
  const managerId = Number(req.params.id);
  const { employeeId, category, productivity, teamwork, creativity, accuracy, notes } = req.body || {};
  if (!employeeId || Number.isNaN(managerId)) {
    return res.status(400).json({ success: false, message: 'Missing evaluation payload' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO evaluations (employee_id, manager_id, category, productivity, teamwork, creativity, accuracy, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        managerId,
        category || 'General',
        productivity ?? null,
        teamwork ?? null,
        creativity ?? null,
        accuracy ?? null,
        notes || null,
      ]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error submitting evaluation' });
  }
});

router.get('/:id/charts', async (req, res) => {
  const managerId = Number(req.params.id);
  if (Number.isNaN(managerId)) return res.status(400).json({ success: false, message: 'Invalid manager id' });

  try {
    const [teamScores] = await pool.query(
      `SELECT employee_name AS label, score FROM team_scores WHERE manager_id = ? ORDER BY score DESC`,
      [managerId]
    );
    const [skills] = await pool.query(
      `SELECT label, value FROM skill_distribution WHERE manager_id = ?`,
      [managerId]
    );
    const [radar] = await pool.query(
      `SELECT metric AS label, value FROM radar_metrics WHERE manager_id = ?`,
      [managerId]
    );

    res.json({
      success: true,
      data: {
        teamScores,
        skillDistribution: skills,
        radarMetrics: radar,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching charts' });
  }
});

router.get('/:id/goals', async (req, res) => {
  const managerId = Number(req.params.id);
  try {
    const [goals] = await pool.query(
      `SELECT g.id, g.title, g.description, g.status, g.progress, g.deadline, e.name as employeeName
       FROM goals g
       JOIN employees e ON g.employee_id = e.id
       WHERE e.manager_id = ?
       ORDER BY g.deadline ASC`,
      [managerId]
    );
    res.json({ success: true, data: goals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching goals' });
  }
});

router.get('/:id/feedback', async (req, res) => {
  const managerId = Number(req.params.id);
  try {
    const [feedback] = await pool.query(
      `SELECT r.id, r.score, r.summary, e.name as employeeName
       FROM reviews r
       JOIN employees e ON r.employee_id = e.id
       WHERE e.manager_id = ?
       ORDER BY r.id DESC
       LIMIT 10`,
      [managerId]
    );
    res.json({ success: true, data: feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching feedback' });
  }
});

router.get('/:id/reports', async (req, res) => {
  try {
    const [kpis] = await pool.query(`SELECT metric, value FROM kpis`);
    res.json({ success: true, data: kpis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching reports' });
  }
});

router.get('/:id/top-employees', async (req, res) => {
  const managerId = Number(req.params.id);
  try {
    const [topEmployees] = await pool.query(
      `SELECT id, name, title, avatar, 
              COALESCE(average_rating, 0) as score,
              COALESCE(productivity, 0) as productivity, 
              COALESCE(teamwork, 0) as teamwork, 
              COALESCE(creativity, 0) as creativity,
              ROUND((COALESCE(productivity, 0) + COALESCE(teamwork, 0) + COALESCE(creativity, 0)) / 3, 0) as calculated_score
       FROM employees 
       WHERE manager_id = ? 
       ORDER BY calculated_score DESC, average_rating DESC, name ASC
       LIMIT 5`,
      [managerId]
    );

    // Use calculated_score if average_rating is 0
    const employeesWithScore = topEmployees.map(emp => ({
      ...emp,
      score: emp.score > 0 ? emp.score : emp.calculated_score
    }));

    res.json({ success: true, data: employeesWithScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching top employees' });
  }
});

router.post('/feedback', async (req, res) => {
  const { employeeId, managerId, period, score, summary, highlights, productivity, teamwork, creativity, accuracy, notes } = req.body;

  if (!employeeId || !managerId || !period || score === undefined || !summary) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Insert review
    const [reviewResult] = await pool.query(
      `INSERT INTO reviews (employee_id, period, score, reviewer, summary, highlights)
       VALUES (?, ?, ?, (SELECT name FROM managers WHERE id = ?), ?, ?)`,
      [employeeId, period, score, managerId, summary, JSON.stringify(highlights || [])]
    );

    // Insert evaluation with detailed ratings
    const [evalResult] = await pool.query(
      `INSERT INTO evaluations (employee_id, manager_id, category, productivity, teamwork, creativity, accuracy, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, managerId, period, productivity || null, teamwork || null, creativity || null, accuracy || null, notes || null]
    );

    // Update employee's average metrics
    await pool.query(
      `UPDATE employees 
       SET productivity = COALESCE(?, productivity),
           teamwork = COALESCE(?, teamwork),
           creativity = COALESCE(?, creativity),
           average_rating = ?
       WHERE id = ?`,
      [productivity, teamwork, creativity, score, employeeId]
    );

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        reviewId: reviewResult.insertId,
        evaluationId: evalResult.insertId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error submitting feedback' });
  }
});

module.exports = router;
