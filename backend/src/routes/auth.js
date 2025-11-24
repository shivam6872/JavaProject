const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Login Route
router.post('/login', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: 'Please provide username, password, and role.' });
    }

    try {
        let query = '';
        if (role === 'manager') {
            query = 'SELECT * FROM managers WHERE email = ? LIMIT 1';
        } else if (role === 'employee') {
            query = 'SELECT * FROM employees WHERE email = ? LIMIT 1';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role specified.' });
        }

        const [rows] = await pool.execute(query, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role,
                title: user.title,
                avatar: user.avatar,
                department: user.department || null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// Register Route
router.post('/register', async (req, res) => {
    const { name, email, password, role, title, department, avatar, managerId } = req.body;

    if (!name || !email || !password || !role || !title) {
        return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    // Password Validation
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long and include at least one number and one special character.'
        });
    }

    try {
        // Check if user exists in ANY table (Global Uniqueness)
        const [existingManager] = await pool.execute('SELECT id FROM managers WHERE email = ?', [email]);
        const [existingEmployee] = await pool.execute('SELECT id FROM employees WHERE email = ?', [email]);

        if (existingManager.length > 0 || existingEmployee.length > 0) {
            return res.status(409).json({ success: false, message: 'User with this email already exists in the system.' });
        }

        let insertQuery = '';
        let values = [];
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === 'manager') {
            if (!department) return res.status(400).json({ success: false, message: 'Department is required for managers.' });
            insertQuery = 'INSERT INTO managers (name, email, password, title, department, avatar) VALUES (?, ?, ?, ?, ?, ?)';
            values = [name, email, hashedPassword, title, department, avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'];
        } else if (role === 'employee') {
            if (!managerId) return res.status(400).json({ success: false, message: 'Manager selection is required for employees.' });
            insertQuery = 'INSERT INTO employees (name, email, password, title, avatar, manager_id, years_experience, projects_completed, average_rating, productivity, teamwork, creativity) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0)';
            values = [name, email, hashedPassword, title, avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', managerId];
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role specified.' });
        }

        // Insert new user
        const [result] = await pool.execute(insertQuery, values);

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please login.',
            userId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// Verify Token Route (Improved)
router.get('/verify', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Refresh user data from DB
        let query = '';
        if (decoded.role === 'manager') {
            query = 'SELECT id, name, email, title, avatar, department FROM managers WHERE id = ?';
        } else if (decoded.role === 'employee') {
            query = 'SELECT id, name, email, title, avatar, department FROM employees WHERE id = ?';
        } else {
            return res.status(401).json({ success: false, message: 'Invalid role in token' });
        }

        const [rows] = await pool.execute(query, [decoded.id]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const user = rows[0];
        res.json({
            success: true,
            user: {
                ...user,
                role: decoded.role
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
});

// Get managers for registration (Public)
router.get('/managers', async (req, res) => {
    try {
        const [managers] = await pool.execute('SELECT id, name, department FROM managers ORDER BY name');
        res.json({ success: true, data: managers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error fetching managers.' });
    }
});

module.exports = router;
