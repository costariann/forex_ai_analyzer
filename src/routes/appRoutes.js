import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Forex AI Analyzer - Welcome! Check /health for status');
});

export default router;
