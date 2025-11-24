const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add user info to request
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

// Middleware to check if user is a manager
const isManager = (req, res, next) => {
    if (req.user.role !== 'manager') {
        return res.status(403).json({ success: false, message: 'Access denied. Managers only.' });
    }
    next();
};

// Middleware to check if user is an employee
const isEmployee = (req, res, next) => {
    if (req.user.role !== 'employee') {
        return res.status(403).json({ success: false, message: 'Access denied. Employees only.' });
    }
    next();
};

module.exports = { verifyToken, isManager, isEmployee, JWT_SECRET };
