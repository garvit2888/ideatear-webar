const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Fix MIME type for .usdz
express.static.mime.define({ 'model/vnd.usdz+zip': ['usdz'] });

app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const allowedExtensions = ['.glb', '.usdz'];
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Only .glb and .usdz files allowed'));
    }
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

app.post('/upload', upload.fields([{ name: 'glb' }, { name: 'usdz' }]), (req, res) => {
  let glbFile = req.files.glb ? req.files.glb[0].filename : null;
  let usdzFile = req.files.usdz ? req.files.usdz[0].filename : null;

  if (glbFile && !usdzFile) {
    const newUSDZFile = glbFile.replace('.glb', '.usdz');
    fs.copyFileSync(`uploads/${glbFile}`, `uploads/${newUSDZFile}`);
    usdzFile = newUSDZFile;
  } else if (usdzFile && !glbFile) {
    const newGLBFile = usdzFile.replace('.usdz', '.glb');
    fs.copyFileSync(`uploads/${usdzFile}`, `uploads/${newGLBFile}`);
    glbFile = newGLBFile;
  }

  const glbUrl = glbFile ? `/uploads/${glbFile}` : null;
  const usdzUrl = usdzFile ? `/uploads/${usdzFile}` : null;
  const viewerLink = `/viewer.html?glb=${glbUrl}&usdz=${usdzUrl}`;

  res.send(`Your AR viewer link: <a href="${viewerLink}" target="_blank">${viewerLink}</a>`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
