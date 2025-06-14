/**
 * Notification Routes
 * Placeholder for notification endpoints
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Notifications endpoint - coming soon' });
});

module.exports = router;
