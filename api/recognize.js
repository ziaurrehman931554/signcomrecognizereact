const express = require('express');
const multer = require('multer');
const { GestureRecognizer, FilesetResolver } = require('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

let gestureRecognizer;

const initializeGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: path.join(__dirname, './model/gesture_recognizer.task'),
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
  });
};

initializeGestureRecognizer();

router.post('/recognize', upload.single('image'), async (req, res) => {
  if (!gestureRecognizer) {
    return res.status(500).json({ error: 'Gesture recognizer not initialized' });
  }

  const filePath = req.file.path;
  const image = new Image();
  image.src = fs.readFileSync(filePath);

  image.onload = async () => {
    const results = await gestureRecognizer.recognize(image);
    fs.unlinkSync(filePath);

    if (results.gestures.length > 0) {
      const categoryName = results.gestures[0][0].categoryName;
      const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
      const handedness = results.handednesses[0][0].displayName;
      res.json({
        gesture: categoryName,
        confidence: categoryScore,
        handedness: handedness
      });
    } else {
      res.json({ gesture: 'No gesture detected' });
    }
  };

  image.onerror = (err) => {
    fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Failed to load image' });
  };
});

module.exports = router;
