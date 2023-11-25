// server.js

const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');

// Conectar a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/school', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());

app.use(cors());



// Configuración del servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
