const { estimateDifficulty } = require('./difficultyEstimator');
const { getRelatedArticles } = require('./googleSearchApi');
const { getRelatedVideos } = require('./youtubeApi');

/**
 * Checks the authenticity and academic relevance of a note.
 * @param {Object} note - The note object (should have title, subject, description, difficulty, etc.)
 * @returns {Promise<{isAuthentic: boolean, reasons: string[], flagForReview: boolean}>}
 */
async function checkNoteAuthenticity(note) {
  const reasons = [];
  let flagForReview = false;

  // 1. Difficulty alignment check
  const subject = (note.subject || '').toLowerCase();
  const difficulty = note.difficulty;
  let expectedDifficulty = estimateDifficulty({
    title: note.title,
    description: note.description,
    summary: note.summary || ''
  });

  // Map estimateDifficulty output to note difficulty scale
  if (expectedDifficulty === 'Easy') expectedDifficulty = 'Basic';
  if (expectedDifficulty === 'Medium') expectedDifficulty = 'Intermediate';
  if (expectedDifficulty === 'Hard') expectedDifficulty = 'Advanced';

  // Example: If subject contains 'advanced' but difficulty is 'Basic', flag
  if (subject.includes('advanced') && difficulty === 'Basic') {
    reasons.push('Subject is advanced but difficulty is marked as Basic.');
    flagForReview = true;
  }
  if (subject.includes('beginner') && difficulty === 'Advanced') {
    reasons.push('Subject is beginner but difficulty is marked as Advanced.');
    flagForReview = true;
  }
  // If estimated and actual difficulty are very different, flag
  if (expectedDifficulty !== difficulty) {
    reasons.push(`Estimated difficulty (${expectedDifficulty}) does not match provided difficulty (${difficulty}).`);
    flagForReview = true;
  }

  // 2. Related content check
  let articlesFound = false;
  let videosFound = false;
  try {
    const articlesResult = await getRelatedArticles(note);
    if (articlesResult.articles && articlesResult.articles.length > 0) {
      articlesFound = true;
    } else {
      reasons.push('No related articles found.');
      flagForReview = true;
    }
  } catch (e) {
    reasons.push('Error fetching related articles.');
    flagForReview = true;
  }
  try {
    const videosResult = await getRelatedVideos(note);
    if (videosResult.videos && videosResult.videos.length > 0) {
      videosFound = true;
    } else {
      reasons.push('No related videos found.');
      flagForReview = true;
    }
  } catch (e) {
    reasons.push('Error fetching related videos.');
    flagForReview = true;
  }

  // 3. Academic relevance (basic check: title/description length)
  if ((note.title || '').length < 5 || (note.description || '').length < 20) {
    reasons.push('Title or description is too short to be academically relevant.');
    flagForReview = true;
  }

  // Final authenticity decision
  const isAuthentic = reasons.length === 0;
  return { isAuthentic, reasons, flagForReview };
}

module.exports = { checkNoteAuthenticity };

// --- Basic Test ---
if (require.main === module) {
  (async () => {
    const note = {
      title: 'Advanced Math',
      subject: 'Advanced Mathematics',
      description: 'This note covers advanced calculus and linear algebra topics.',
      difficulty: 'Basic',
      summary: ''
    };
    const result = await checkNoteAuthenticity(note);
    console.log('Test Note:', note);
    console.log('Authenticity Check Result:', result);
  })();
} 