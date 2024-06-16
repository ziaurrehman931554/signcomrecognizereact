const express = require('express');
const recognizeRouter = require('./api/recognize');

const app = express();
const port = process.env.PORT || 3000;

app.use('/api', recognizeRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
