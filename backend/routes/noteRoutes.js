const express = require("express");
const protect = require("../middlewares/authMiddleware");
const router = express.Router();
const upload = require("../config/multer");
const Note = require("../models/Note");
const Review = require("../models/Review");
const path = require("path");
const fs = require("fs");
const { estimateDifficulty } = require("../utils/difficultyEstimator");
const youtubeApi = require('../utils/youtubeApi');
const googleSearchApi = require('../utils/googleSearchApi');
const pdfParse = require('pdf-parse');


router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    const { title, subject, description, difficulty: incomingDifficulty } = req.body;

    if (!req.file || !title || !subject) {
      return res
        .status(400)
        .json({ message: "File, title, and subject are required" });
    }

    const fileUrl = req.file.secure_url || req.file.url || req.file.path;

    function mapDifficulty(level) {
      if (level === "Easy") return "Basic";
      if (level === "Medium") return "Intermediate";
      if (level === "Hard") return "Advanced";
      return level;
    }

    let finalDifficulty = incomingDifficulty;
    if (!finalDifficulty) {
      finalDifficulty = estimateDifficulty({ title, description });
    }
    finalDifficulty = mapDifficulty(finalDifficulty);

    let summary = "";
    // Summary feature is currently disabled. Uncomment below to enable in the future.
    // try {
    //   summary = await summarizeText(fileUrl);
    // } catch (summaryErr) {
    //   console.error("Error generating summary:", summaryErr);
    //   summary = "Summary not available";
    // }
    summary = "Summary feature is currently disabled";

    // Extract content from PDF if applicable
    let content = '';
    if (req.file.mimetype === 'application/pdf') {
      try {
        const dataBuffer = req.file.buffer ? req.file.buffer : require('fs').readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        content = pdfData.text || '';
      } catch (err) {
        console.error('Error extracting PDF text:', err);
        content = '';
      }
    }

    const newNote = new Note({
      title,
      subject,
      description,
      fileUrl,
      uploadedBy: req.user.userId,
      downloadedBy: [],
      downloadCount: 0,
      likedBy: [],
      difficulty: finalDifficulty,
      summary,
      status: 'pending', // Explicitly set status to pending
      content,
    });

    await newNote.save();

    res.status(201).json({
      message: "Note uploaded successfully",
      note: newNote,
    });
 } catch (error) {
  console.error('🔥 FULL ERROR:', error);
  console.error('🔥 STACK TRACE:', error.stack);
  res.status(500).json({ error: error.message || 'Internal Server Error' });
}

});


router.get("/", async (req, res) => {
  try {
    const notes = await Note.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "username email")
      .populate("downloadedBy", "_id");

    const reviewCounts = await Review.aggregate([
      { $group: { _id: "$note", count: { $sum: 1 } } },
    ]);

    // Aggregate average ratings
    const reviewAverages = await Review.aggregate([
      { $group: { _id: "$note", avgRating: { $avg: "$rating" } } },
    ]);

    const reviewCountMap = {};
    reviewCounts.forEach((rc) => {
      reviewCountMap[rc._id.toString()] = rc.count;
    });

    const reviewAvgMap = {};
    reviewAverages.forEach((ra) => {
      reviewAvgMap[ra._id.toString()] = ra.avgRating;
    });

    const notesWithExtras = notes.map((note) => {
      const n = note.toObject();
      n.reviewCount = reviewCountMap[n._id.toString()] || 0;
      n.averageRating = reviewAvgMap[n._id.toString()] || 0;
      n.likes = note.likedBy?.length || 0;
      return n;
    });

    res.status(200).json({ notes: notesWithExtras });
  } catch (error) {
  console.error('🔥 FULL ERROR:', error);
  console.error('🔥 STACK TRACE:', error.stack);
  res.status(500).json({ error: error.message || 'Internal Server Error' });
}

});

router.get("/favorites", protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notes = await Note.find({ likedBy: userId })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "username email");

    res.status(200).json(notes);
  } catch (error) {
  console.error('🔥 FULL ERROR:', error);
  console.error('🔥 STACK TRACE:', error.stack);
  res.status(500).json({ error: error.message || 'Internal Server Error' });
}

});


router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "uploadedBy",
      "username email"
    );
    if (!note) return res.status(404).json({ message: "Note not found" });

    // Aggregate review count and average rating for this note
    const [reviewStats] = await Review.aggregate([
      { $match: { note: note._id } },
      { $group: { _id: "$note", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } }
    ]);

    const noteObj = note.toObject();
    noteObj.reviewCount = reviewStats ? reviewStats.count : 0;
    noteObj.averageRating = reviewStats ? reviewStats.avgRating : 0;

    res.status(200).json({ note: noteObj });
  } catch (error) {
    console.error('🔥 FULL ERROR:', error);
    console.error('🔥 STACK TRACE:', error.stack);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});


router.put("/:id/download", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const userId = req.user.userId;
    if (!note.downloadedBy.includes(userId)) {
      note.downloadedBy.push(userId);
    }

    note.downloadCount += 1;
    await note.save();

    res.status(200).json({ message: "Download tracked", note });
  } catch (err) {
    console.error("Download tracking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id/like", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const userId = req.user.userId;
    const alreadyLiked = note.likedBy.includes(userId);

    if (alreadyLiked) {
      note.likedBy = note.likedBy.filter((id) => id.toString() !== userId);
    } else {
      note.likedBy.push(userId);
    }

    await note.save();

    res.status(200).json({
      message: alreadyLiked ? "Unliked" : "Liked",
      likedBy: note.likedBy,
      likeCount: note.likedBy.length,
    });
  } catch (err) {
    console.error("Like toggle error:", err);
    res.status(500).json({ message: "Server error while liking note" });
  }
});


router.post("/:id/favorite", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const userId = req.user.userId;
    if (!note.likedBy.includes(userId)) {
      note.likedBy.push(userId);
      await note.save();
    }

    res.status(200).json({
      message: "Added to favorites",
      likedBy: note.likedBy,
      likeCount: note.likedBy.length,
    });
  } catch (err) {
    console.error("Add to favorites error:", err);
    res.status(500).json({ message: "Server error while adding to favorites" });
  }
});


router.delete("/:id/favorite", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const userId = req.user.userId;
    note.likedBy = note.likedBy.filter((id) => id.toString() !== userId);
    await note.save();

    res.status(200).json({
      message: "Removed from favorites",
      likedBy: note.likedBy,
      likeCount: note.likedBy.length,
    });
  } catch (err) {
    console.error("Remove from favorites error:", err);
    res
      .status(500)
      .json({ message: "Server error while removing from favorites" });
  }
});


router.delete("/:id", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.uploadedBy.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this note" });
    }

    await note.deleteOne();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.patch("/:id", protect, upload.single("file"), async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.uploadedBy.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to edit this note" });
    }

    if (req.body.title) note.title = req.body.title;
    if (req.body.subject) note.subject = req.body.subject;
    if (req.body.description) note.description = req.body.description;
    if (req.file) note.fileUrl = req.file.path;
    if (req.body.difficulty) note.difficulty = req.body.difficulty;

    await note.save();
    res.status(200).json({ message: "Note updated successfully", note });
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ message: "Server error while updating note" });
  }
});


router.get("/:id/download-file", protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const filePath = note.fileUrl;

    if (filePath.startsWith("http")) {
      return res.redirect(filePath);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("File download error:", err);
    res.status(500).json({ message: "Server error while downloading file" });
  }
});

// Get related YouTube videos for a note
router.get('/:id/related-videos', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const result = await youtubeApi.getRelatedVideos(note);
    res.json({ data: result });
  } catch (err) {
    console.error('Error fetching related videos:', err);
    res.status(500).json({ message: 'Failed to fetch related videos' });
  }
});

// Get related articles for a note
router.get('/:id/related-articles', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const result = await googleSearchApi.getRelatedArticles(note);
    res.json({ data: result });
  } catch (err) {
    console.error('Error fetching related articles:', err);
    res.status(500).json({ message: 'Failed to fetch related articles' });
  }
});

// Get both related videos and articles for a note (suggestions)
router.get('/:id/suggestions', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const [videosResult, articlesResult] = await Promise.all([
      youtubeApi.getRelatedVideos(note),
      googleSearchApi.getRelatedArticles(note)
    ]);
    res.json({
      keywords: videosResult.keywords || articlesResult.keywords || [],
      videos: videosResult.videos || [],
      articles: articlesResult.articles || []
    });
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
});

// --- ADMIN NOTE VALIDATION ENDPOINTS ---
const ADMIN_TOKEN_HEADER = 'x-admin-token';
function isAdmin(req) {
  // Simple check: token must match the one in localStorage (for demo; improve for production)
  const token = req.header(ADMIN_TOKEN_HEADER);
  return !!token; // In production, verify token properly
}

// List all notes (admin view)
router.get('/admin/all', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve a note
router.post('/admin/:id/approve', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note approved', note });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject a note
router.post('/admin/:id/reject', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note rejected', note });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a note (admin)
router.delete('/admin/:id', async (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;



