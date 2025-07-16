const axios = require('axios');


const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';


function extractKeywords(title = '', description = '', subject = '', content = '') {
  const text = `${title} ${description} ${subject} ${content}`.toLowerCase();

  const educationalKeywords = [
    'tutorial', 'lecture', 'course', 'lesson', 'explanation', 'guide',
    'introduction', 'basics', 'fundamentals', 'advanced', 'concepts',
    'examples', 'practice', 'exercises', 'problems', 'solutions',
    'theory', 'principles', 'methods', 'techniques', 'algorithms',
    'data structures', 'programming', 'mathematics', 'physics',
    'chemistry', 'biology', 'engineering', 'computer science'
  ];
  

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);
  
  const words = text.match(/\b\w+\b/g) || [];
  const filteredWords = words.filter(word => 
    word.length > 2 && !stopWords.has(word)
  );
  

  const wordCount = {};
  filteredWords.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  const sortedWords = Object.entries(wordCount)
    .sort((a, b) => {
      const aIsEducational = educationalKeywords.includes(a[0]);
      const bIsEducational = educationalKeywords.includes(b[0]);
      
      if (aIsEducational && !bIsEducational) return -1;
      if (!aIsEducational && bIsEducational) return 1;
      
      return b[1] - a[1];
    })
    .slice(0, 5)
    .map(([word]) => word);
  
  return sortedWords;
}

async function fetchRelatedVideos(keywords, maxResults = 5) {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured');
    return [];
  }
  
  try {
    const query = keywords.join(' ');
    
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        videoCategoryId: '27',
        maxResults: maxResults,
        order: 'relevance',
        key: YOUTUBE_API_KEY
      }
    });
    
    const videos = response.data.items || [];
    

    if (videos.length > 0) {
      const videoIds = videos.map(video => video.id.videoId);
      
      const detailsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          part: 'contentDetails,statistics',
          id: videoIds.join(','),
          key: YOUTUBE_API_KEY
        }
      });
      
      const videoDetails = detailsResponse.data.items || [];
      

      return videos.map((video, index) => {
        const details = videoDetails.find(d => d.id === video.id.videoId) || {};
        
        return {
          id: video.id.videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: details.contentDetails?.duration || null,
          viewCount: details.statistics?.viewCount || null,
          likeCount: details.statistics?.likeCount || null,
          url: `https://www.youtube.com/watch?v=${video.id.videoId}`
        };
      });
    }
    
    return videos.map(video => ({
      id: video.id.videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`
    }));
    
  } catch (error) {
    console.error('Error fetching YouTube videos:', error.message);
    return [];
  }
}


function formatDuration(duration) {
  if (!duration) return null;
  
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return null;
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  let result = '';
  if (hours) result += `${hours}:`;
  result += `${minutes.padStart(2, '0')}:`;
  result += `${seconds.padStart(2, '0')}`;
  
  return result;
}


async function getRelatedVideos(note) {
  const content = note.content || '';
  const keywords = extractKeywords(note.title, note.description, note.subject, content);
  const videos = await fetchRelatedVideos(keywords);
  
  return {
    keywords,
    videos: videos.map(video => ({
      ...video,
      duration: formatDuration(video.duration),
      viewCount: video.viewCount ? parseInt(video.viewCount).toLocaleString() : null,
      likeCount: video.likeCount ? parseInt(video.likeCount).toLocaleString() : null
    }))
  };
}

module.exports = {
  extractKeywords,
  fetchRelatedVideos,
  getRelatedVideos,
  formatDuration
}; 