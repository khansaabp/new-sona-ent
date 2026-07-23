const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Comprehensive stopword list (natural's built-in + our own additions)
const stopwords = new Set([
  ...natural.stopwords,
  'customer', 'always', 'never', 'also', 'just', 'about', 'would', 'could',
  'wants', 'want', 'wanted', 'said', 'told', 'asked', 'says', 'like', 'likes',
  'liked', 'need', 'needs', 'needed', 'get', 'gets', 'got', 'buy', 'buys',
  'bought', 'purchase', 'purchased', 'order', 'orders', 'ordered', 'shop',
  'shops', 'store', 'stores', 'time', 'times', 'day', 'days', 'good', 'nice',
  'okay', 'ok', 'well', 'much', 'many', 'lot', 'lots'
]);

/**
 * Tokenizes and stems a block of text into meaningful word roots.
 * e.g. "laptops" and "laptop" both stem to "laptop", so they match as the same concept.
 */
const extractStemmedTokens = (text) => {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return tokens
    .filter(t => t.length > 2 && !stopwords.has(t) && !/^\d+$/.test(t))
    .map(t => stemmer.stem(t));
};

/**
 * Fuzzy-checks whether a product name/brand is mentioned in a note,
 * even with minor typos, using Jaro-Winkler string similarity plus
 * stemmed substring matching for multi-word product names.
 */
const isProductMentioned = (noteText, productName, productBrand) => {
  const noteLower = noteText.toLowerCase();
  const nameLower = productName.toLowerCase();
  const brandLower = productBrand.toLowerCase();

  // 1. Direct substring match (fastest, catches exact/partial mentions)
  if (noteLower.includes(nameLower)) return { matched: true, confidence: 1.0, method: 'exact' };

  // 2. Brand mention (only if brand name is distinctive enough, 4+ chars)
  if (brandLower.length > 3 && noteLower.includes(brandLower)) {
    return { matched: true, confidence: 0.7, method: 'brand' };
  }

  // 3. Stemmed token overlap — e.g. note says "wants the galaxy phones"
  //    matches product "Galaxy Pulse X12 5G Smartphone" via stemmed word overlap
  const noteTokens = new Set(extractStemmedTokens(noteText));
  const productTokens = extractStemmedTokens(productName);
  const significantProductTokens = productTokens.filter(t => t.length > 3);

  if (significantProductTokens.length === 0) return { matched: false };

  const overlapCount = significantProductTokens.filter(t => noteTokens.has(t)).length;
  const overlapRatio = overlapCount / significantProductTokens.length;

  if (overlapRatio >= 0.5) {
    return { matched: true, confidence: overlapRatio * 0.6, method: 'stemmed-overlap' };
  }

  // 4. Fuzzy similarity check for typo tolerance (e.g. "saundwave" vs "SoundWave")
  const words = noteLower.split(/\s+/);
  for (const word of words) {
    if (word.length < 4) continue;
    const similarity = natural.JaroWinklerDistance(word, brandLower);
    if (similarity > 0.88 && brandLower.length > 3) {
      return { matched: true, confidence: similarity * 0.5, method: 'fuzzy' };
    }
  }

  return { matched: false };
};

/**
 * Extracts and ranks the most significant keywords/themes from a collection of notes
 * using stemmed word frequency, ignoring stopwords.
 */
const extractTopKeywords = (notesArray, limit = 15) => {
  const freqMap = {};
  const displayMap = {}; // stemmed -> most common original word form

  notesArray.forEach(note => {
    const rawTokens = tokenizer.tokenize(note.toLowerCase())
      .filter(t => t.length > 3 && !stopwords.has(t) && !/^\d+$/.test(t));

    rawTokens.forEach(rawToken => {
      const stemmed = stemmer.stem(rawToken);
      freqMap[stemmed] = (freqMap[stemmed] || 0) + 1;

      // Track which raw form appears most often for nicer display
      if (!displayMap[stemmed]) displayMap[stemmed] = {};
      displayMap[stemmed][rawToken] = (displayMap[stemmed][rawToken] || 0) + 1;
    });
  });

  return Object.entries(freqMap)
    .map(([stemmed, count]) => {
      // Pick the most frequent raw variant for display (e.g. "laptop" over "laptops")
      const variants = displayMap[stemmed];
      const bestDisplay = Object.entries(variants).sort((a, b) => b[1] - a[1])[0][0];
      return { word: bestDisplay, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Basic sentiment scoring per note using natural's AFINN-based analyzer.
 * Returns a score: positive = happy customer, negative = frustrated/complaint.
 */
const analyzeSentiment = (text) => {
  const Analyzer = natural.SentimentAnalyzer;
  const stemmerForSentiment = natural.PorterStemmer;
  const analyzer = new Analyzer('English', stemmerForSentiment, 'afinn');
  const tokens = tokenizer.tokenize(text);
  if (tokens.length === 0) return 0;
  return analyzer.getSentiment(tokens);
};

module.exports = {
  extractStemmedTokens,
  isProductMentioned,
  extractTopKeywords,
  analyzeSentiment
};