/**
 * Project Routes
 * Placeholder for project endpoints
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Projects endpoint - coming soon' });
});

module.exports = router;
