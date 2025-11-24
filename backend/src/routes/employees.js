const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(verifyToken);

// Get all employees
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, title, department, address, working_status AS workingStatus, 
              COALESCE(productivity, 0) as productivity, 
              COALESCE(teamwork, 0) as teamwork, 
              COALESCE(creativity, 0) as creativity,
              avatar
       FROM employees
       ORDER BY name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching employees' });
  }
});

// Get employee profile and details
router.get('/:id', async (req, res) => {
  const employeeId = Number(req.params.id);
  if (Number.isNaN(employeeId)) return res.status(400).json({ success: false, message: 'Invalid employee id' });

  try {
    const [[profile]] = await pool.query(
      `SELECT e.id, e.name, e.title, e.email, e.phone, e.address, e.department, e.working_status AS workingStatus, e.avatar,
              COALESCE(e.years_experience, 0) AS yearsExperience,
              COALESCE(e.projects_completed, 0) AS projectsCompleted, 
              COALESCE(e.average_rating, 0) AS averageRating,
              COALESCE(e.productivity, 0) as productivity, 
              COALESCE(e.teamwork, 0) as teamwork, 
              COALESCE(e.creativity, 0) as creativity, 
              m.name AS managerName
       FROM employees e
       LEFT JOIN managers m ON m.id = e.manager_id
       WHERE e.id = ?`,
      [employeeId]
    );

    if (!profile) return res.status(404).json({ success: false, message: 'Employee not found' });

    const [
      achievements,
      skills,
      goals,
      reviews,
      tasks,
      notifications,
    ] = await Promise.all([
      pool.query(
        `SELECT id, title, description, badge_type AS badgeType, icon
         FROM achievements WHERE employee_id = ? ORDER BY id`,
        [employeeId]
      ),
      pool.query(
        `SELECT id, skill, proficiency
         FROM skills WHERE employee_id = ? ORDER BY proficiency DESC`,
        [employeeId]
      ),
      pool.query(
        `SELECT id, title, description, status, progress, deadline, completed_on AS completedOn
         FROM goals WHERE employee_id = ? ORDER BY deadline`,
        [employeeId]
      ),
      pool.query(
        `SELECT id, period, reviewer, score, summary, highlights
         FROM reviews WHERE employee_id = ? ORDER BY id DESC`,
        [employeeId]
      ),
      pool.query(
        `SELECT id, description, completed, created_at AS createdAt
         FROM tasks WHERE employee_id = ? ORDER BY id DESC`,
        [employeeId]
      ),
      pool.query(
        `SELECT id, title, body, icon, created_at AS createdAt
         FROM notifications WHERE employee_id = ? ORDER BY created_at DESC`,
        [employeeId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        profile,
        achievements: achievements[0],
        skills: skills[0],
        goals: goals[0],
        reviews: reviews[0].map((item) => ({
          ...item,
          highlights: item.highlights ? (typeof item.highlights === 'string' ? item.highlights.split(',').map(h => h.trim()) : item.highlights) : [],
        })),
        tasks: tasks[0],
        notifications: notifications[0],
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching employee details' });
  }
});

// Get Employee Overview (New Route)
router.get('/:id/overview', async (req, res) => {
  const employeeId = Number(req.params.id);
  if (Number.isNaN(employeeId)) return res.status(400).json({ success: false, message: 'Invalid employee id' });

  try {
    const [[profile]] = await pool.query(
      `SELECT id, name, title, avatar, 
                    COALESCE(productivity, 0) as productivity, 
                    COALESCE(teamwork, 0) as teamwork, 
                    COALESCE(creativity, 0) as creativity
             FROM employees WHERE id = ?`,
      [employeeId]
    );

    if (!profile) return res.status(404).json({ success: false, message: 'Employee not found' });

    const [tasks] = await pool.query(
      `SELECT id, description, completed FROM tasks WHERE employee_id = ? ORDER BY id DESC LIMIT 5`,
      [employeeId]
    );

    const [reviews] = await pool.query(
      `SELECT id, score, period FROM reviews WHERE employee_id = ? ORDER BY id DESC LIMIT 1`,
      [employeeId]
    );

    res.json({
      success: true,
      data: {
        profile,
        recentTasks: tasks,
        latestReview: reviews[0] || null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching overview' });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  const { name, email, phone, title, department, address, workingStatus, managerId } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  try {
    // Default password for new employees (hashed version of "password123")
    const defaultPassword = '$2b$10$UjfwjjB6E0Jh3lBhfvAvXuumy48eLTMu8qsKIwSTqBuLtMM597G9.';

    const [result] = await pool.query(
      `INSERT INTO employees (name, email, phone, title, department, address, working_status, manager_id, password, avatar, productivity, teamwork, creativity, average_rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0)`,
      [
        name,
        email,
        phone || null,
        title || 'Employee',
        department || null,
        address || null,
        workingStatus !== false ? 1 : 0,
        managerId || null,
        defaultPassword,
        'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { id: result.insertId }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating employee' });
  }
});

// Update employee details
router.patch('/:id', async (req, res) => {
  const employeeId = Number(req.params.id);
  const { name, email, phone, title, department, address, workingStatus } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE employees 
       SET name = ?, email = ?, phone = ?, title = ?, department = ?, address = ?, working_status = ?
       WHERE id = ?`,
      [name, email, phone || null, title, department || null, address || null, workingStatus !== false ? 1 : 0, employeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating employee' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  const employeeId = Number(req.params.id);

  try {
    // Delete related records first
    await pool.query('DELETE FROM tasks WHERE employee_id = ?', [employeeId]);
    await pool.query('DELETE FROM notifications WHERE employee_id = ?', [employeeId]);
    await pool.query('DELETE FROM reviews WHERE employee_id = ?', [employeeId]);
    await pool.query('DELETE FROM goals WHERE employee_id = ?', [employeeId]);
    await pool.query('DELETE FROM skills WHERE employee_id = ?', [employeeId]);
    await pool.query('DELETE FROM achievements WHERE employee_id = ?', [employeeId]);
    await pool.query('DELETE FROM evaluations WHERE employee_id = ?', [employeeId]);

    // Delete employee
    const [result] = await pool.query('DELETE FROM employees WHERE id = ?', [employeeId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error deleting employee' });
  }
});

// Create Task
router.post('/:id/tasks', async (req, res) => {
  const employeeId = Number(req.params.id);
  const { description } = req.body || {};
  if (Number.isNaN(employeeId) || !description) {
    return res.status(400).json({ success: false, message: 'Task description required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO tasks (employee_id, description) VALUES (?, ?)`,
      [employeeId, description.trim()]
    );
    res.status(201).json({
      success: true,
      data: { id: result.insertId, description: description.trim(), completed: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating task' });
  }
});

// Update Task
router.patch('/:employeeId/tasks/:taskId', async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const taskId = Number(req.params.taskId);
  const { completed } = req.body || {};
  if (Number.isNaN(employeeId) || Number.isNaN(taskId) || typeof completed === 'undefined') {
    return res.status(400).json({ success: false, message: 'Invalid task request' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE tasks SET completed = ? WHERE id = ? AND employee_id = ?`,
      [completed ? 1 : 0, taskId, employeeId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({
      success: true,
      data: { id: taskId, completed: completed ? 1 : 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating task' });
  }
});

module.exports = router;
