/**
 * Dashboard Routes
 * Placeholder for dashboard endpoints
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Dashboard endpoint - coming soon' });
});

module.exports = router;
