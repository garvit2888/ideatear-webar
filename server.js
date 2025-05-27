const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Serve static files from public and uploads folders
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Correct MIME types manually for 3D model files (especially .glb and .usdz)
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'application/octet-stream';

  if (ext === '.glb') {
    contentType = 'model/gltf-binary';
  } else if (ext === '.gltf') {
    contentType = 'model/gltf+json';
  } else if (ext === '.usdz') {
    contentType = 'model/vnd.usdz+zip';
  }

  res.setHeader('Content-Type', contentType);
  res.sendFile(filePath);
});

// File upload route
app.post('/upload', upload.fields([{ name: 'glb' }, { name: 'usdz' }]), (req, res) => {
  const glbFile = req.files['glb'] ? req.files['glb'][0].filename : null;
  const usdzFile = req.files['usdz'] ? req.files['usdz'][0].filename : null;

  const response = {
    glbUrl: glbFile ? `/uploads/${glbFile}` : null,
    usdzUrl: usdzFile ? `/uploads/${usdzFile}` : null,
    viewUrl: `/viewer.html?glb=${glbFile ? `/uploads/${glbFile}` : 'null'}&usdz=${usdzFile ? `/uploads/${usdzFile}` : 'null'}`
  };

  res.json(response);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

