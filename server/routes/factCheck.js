import express from 'express';

const router = express.Router();

// Controller will be passed in from main server
let factCheckController = null;

export const setFactCheckController = (controller) => {
  factCheckController = controller;
};

// Fact-check a claim
router.post('/', async (req, res) => {
  if (!factCheckController) {
    return res.status(500).json({ success: false, error: 'Fact check service not initialized' });
  }
  await factCheckController.factCheckClaim(req, res);
});

// Analyze article for misinformation
router.post('/analyze', async (req, res) => {
  if (!factCheckController) {
    return res.status(500).json({ success: false, error: 'Fact check service not initialized' });
  }
  await factCheckController.analyzeArticle(req, res);
});

// Get RAG system evaluation metrics
router.get('/metrics', async (req, res) => {
  if (!factCheckController) {
    return res.status(500).json({ success: false, error: 'Fact check service not initialized' });
  }
  await factCheckController.getEvaluationMetrics(req, res);
});

export default router;
