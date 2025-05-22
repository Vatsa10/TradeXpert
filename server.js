// Minimal Express server to serve Yahoo Finance API to frontend
const express = require('express');
const cors = require('cors');
const stockApi = require('./api-stock');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use('/api', stockApi);

app.get('/', (req, res) => {
  res.send('Stock API server running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
