/**
 * Assignment Routes
 * Placeholder for assignment endpoints
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Assignments endpoint - coming soon' });
});

module.exports = router;
