// index.js (in Forex_AI_Analyzer/)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import appRoutes from './src/routes/appRoutes.js';
import { getForexData } from './src/controller/appController.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Serving static files from:', path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public')));

app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/', appRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api/forex', getForexData);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log('Server is running on port 3005');
});

export default app;
