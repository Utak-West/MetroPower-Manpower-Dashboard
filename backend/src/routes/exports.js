/**
 * Export Routes
 * Placeholder for export endpoints
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Exports endpoint - coming soon' });
});

module.exports = router;
