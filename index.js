import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();

const __filename = path.dirname(fileURLToPath(import.meta.url));
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send(
    'Forex AI Analyzer setup complete (using Docker Compose and client-side Chart.js)'
  );
});

app.listen(3005, () => {
  console.log('Server is running on port 3005');
});
