import express from 'express';

const router = express.Router();

// Controller will be passed in from main server
let factCheckController = null;

export const setFactCheckController = (controller) => {
  factCheckController = controller;
};

// Get latest news
router.get('/', async (req, res) => {
  if (!factCheckController) {
    return res.status(500).json({ success: false, error: 'News service not initialized' });
  }
  await factCheckController.getLatestNews(req, res);
});

// Get trending topics
router.get('/trending', async (req, res) => {
  if (!factCheckController) {
    return res.status(500).json({ success: false, error: 'News service not initialized' });
  }
  await factCheckController.getTrendingTopics(req, res);
});

// Get system statistics
router.get('/stats', async (req, res) => {
  if (!factCheckController) {
    return res.status(500).json({ success: false, error: 'News service not initialized' });
  }
  await factCheckController.getSystemStats(req, res);
});

// Get daily activity data
router.get('/activity', async (req, res) => {
  if (!factCheckController) {
    return res.status(500).json({ success: false, error: 'News service not initialized' });
  }
  await factCheckController.getDailyActivity(req, res);
});

export default router;
