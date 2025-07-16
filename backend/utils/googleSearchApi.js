const axios = require('axios');

const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CUSTOM_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
const GOOGLE_SEARCH_API_BASE_URL = 'https://www.googleapis.com/customsearch/v1';


function extractArticleKeywords(title = '', description = '', subject = '', summary = '', content = '') {

  const text = `${title} ${description} ${subject} ${summary} ${content}`.toLowerCase();


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


  const sortedKeywords = Object.keys(wordCount)
    .sort((a, b) => wordCount[b] - wordCount[a])
    .slice(0, 6);


  return [...sortedKeywords, 'educational', 'article', 'tutorial', 'guide'];
}


async function fetchRelatedArticles(keywords, maxResults = 8) {
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
    console.warn('Google Custom Search API not configured');
    return [];
  }
  
  try {
    
    const query = (keywords && keywords.length > 0) ? keywords.join(' ') : 'educational article';
    
    const response = await axios.get(GOOGLE_SEARCH_API_BASE_URL, {
      params: {
        key: GOOGLE_SEARCH_API_KEY,
        cx: GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
        q: query,
        num: Math.min(maxResults, 10)
      }
    });
    
    
    
    const items = response.data.items || [];
    
    const articles = items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
      displayLink: item.displayLink,
      formattedUrl: item.formattedUrl,
      image: item.pagemap?.cse_image?.[0]?.src || null,
      publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'] || null
    }));
    
    return articles;
    
  } catch (error) {
    console.error('Error fetching Google Custom Search results:', error.message);
    return [];
  }
}


function formatArticleDate(dateString) {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return null;
  }
}


async function getRelatedArticles(note) {

  const summary = note.summary || '';
  const content = note.content || '';
  const keywords = extractArticleKeywords(note.title, note.description, note.subject, summary, content);
  const articles = await fetchRelatedArticles(keywords);

  return {
    keywords,
    articles: articles.map(article => ({
      ...article,
      publishedDate: formatArticleDate(article.publishedDate)
    }))
  };
}

module.exports = {
  extractArticleKeywords,
  fetchRelatedArticles,
  getRelatedArticles,
  formatArticleDate
}; 