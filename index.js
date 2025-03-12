import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send(
    'Forex AI Analyzer setup complete (using Docker Compose and client-side Chart.js)'
  );
});

app.listen(3005, () => {
  console.log('Server is running on port 3005');
});
