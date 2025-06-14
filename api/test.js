/**
 * Simple test endpoint to check if the API is working
 */

module.exports = (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Simple test response
        res.status(200).json({
            success: true,
            message: 'API is working!',
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                VERCEL: process.env.VERCEL,
                USE_MEMORY_DB: process.env.USE_MEMORY_DB
            }
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            error: 'Test endpoint failed',
            message: error.message,
            stack: error.stack
        });
    }
};
