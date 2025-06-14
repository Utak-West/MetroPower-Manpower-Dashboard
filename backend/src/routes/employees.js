/**
 * Employee Routes
 * Placeholder for employee endpoints
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Employees endpoint - coming soon' });
});

module.exports = router;
