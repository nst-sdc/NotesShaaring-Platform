const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const authMiddleware = require('../middlewares/authMiddleware');
const Note = require('../models/Note');


router.post('/notes', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log('req.user:', req.user);
    const { title, subject, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const newNote = new Note({
      title,
      subject,
      description,
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.userId,
    });

    await newNote.save();
    res.status(201).json({ message: 'Note uploaded successfully', note: newNote });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find()
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'username email'); 

    res.status(200).json({ notes });
  } catch (err) {
    console.error('❌ Fetch notes error:', err);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

module.exports = router;

router.delete("/notes/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check ownership
    if (note.uploadedBy.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this note" });
    }

    await note.deleteOne();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
