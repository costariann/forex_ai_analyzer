import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import appRoutes from './src/routes/appRoutes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log the public folder path for debugging
console.log('Serving static files from:', path.join(__dirname, 'public'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for '/' and '/index.html'
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Use appRoutes for other routes
app.use('/', appRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(3005, () => {
  console.log('Server is running on port 3005');
});
