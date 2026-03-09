import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/dev/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder routes - will be implemented gradually
app.post('/dev/merchants/login', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/dev/merchants/signup', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/dev/auth/register', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.post('/dev/auth/login', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.get('/dev/categories', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

app.get('/dev/shops/nearby', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
