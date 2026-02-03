import { Article, PublicationEdition } from '../types';

/**
 * USER INTEREST TRACKING
 */
export const trackInterest = (category: string) => {
  if (typeof window === 'undefined') return;
  const interests = JSON.parse(localStorage.getItem('gujab_interests') || '{}');
  interests[category] = (interests[category] || 0) + 1;
  localStorage.setItem('gujab_interests', JSON.stringify(interests));
};

const getUserInterests = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  return JSON.parse(localStorage.getItem('gujab_interests') || '{}');
};

/**
 * SCORING CONSTANTS
 */
const RECENCY_BOOST_WINDOW_MS = 2 * 60 * 60 * 1000; 
const VELOCITY_WEIGHT = 1.5;
const INTEREST_WEIGHT = 2.0;
const MAX_CANDIDATES = 500; 

// NEW HERO CONSTANTS
const FRESH_CONTENT_LOCKOUT_MS = 60 * 60 * 1000; // 1 Hour Lockout for Hero

/**
 * SPECIAL HERO ALGORITHM
 * Criteria: "Most public attention in shortest time"
 * Constraint: No fresh articles (< 1 hour old).
 */
const calculateAttentionVelocity = (article: Article, now: number): number => {
    const created = article.created_at ? Date.parse(article.created_at) : (article.date ? Date.parse(article.date) : now);
    const ageInMs = now - created;

    // CONSTRAINT: If article is younger than 1 hour, it gets a score of -1 (Disqualified from Hero)
    if (ageInMs < FRESH_CONTENT_LOCKOUT_MS) return -1;

    const likes = Array.isArray(article.liked_by) ? article.liked_by.length : 0;
    const ageInHours = ageInMs / 3600000;

    // Formula: Likes / Time^0.8
    // We dampen Time slightly so older "Mega Hits" still have a chance against newer "Quick Hits"
    // This allows the algorithm to pick the best from Day OR Week OR Month based on intensity.
    if (likes === 0) return 0;
    
    return Math.pow(likes, 1.2) / Math.pow(ageInHours, 0.8);
};

/**
 * OPTIMIZED VIRAL VELOCITY SCORE (For General Grid)
 */
const computeViralScoreOptimized = (article: Article, now: number): number => {
  const likes = Array.isArray(article.liked_by) ? article.liked_by.length : 0;
  const created = article.created_at ? Date.parse(article.created_at) : (article.date ? Date.parse(article.date) : now);
  const ageInHours = Math.max(0.1, (now - created) / 3600000);
  
  const velocity = (likes + 1) / Math.pow(ageInHours + 2, VELOCITY_WEIGHT);
  const isBreaking = (now - created) < RECENCY_BOOST_WINDOW_MS;
  return velocity * (isBreaking ? 5.0 : 1.0);
};

const computeRelevanceScore = (article: Article, interests: Record<string, number>): number => {
  const categoryAffinity = interests[article.category] || 0;
  return 1 + (Math.log10(categoryAffinity + 1) * INTEREST_WEIGHT);
};

export const getRandomEdition = (): PublicationEdition => {
  const editions: PublicationEdition[] = ['TOP_OF_HOUR', 'TOP_OF_DAY', 'TOP_OF_WEEK', 'ALL_TIME_CLASSICS', 'STANDARD_GRAVITY'];
  return editions[Math.floor(Math.random() * editions.length)];
};

export const getEditionLabel = (edition: PublicationEdition): string => {
  const labels: Record<PublicationEdition, string> = {
    TOP_OF_HOUR: 'Rising Now',
    TOP_OF_DAY: 'Recommended For You',
    TOP_OF_WEEK: 'The Weekly Algorithm',
    TOP_OF_MONTH: 'Monthly Deep Dives',
    ALL_TIME_CLASSICS: 'Legendary Gujabs',
    STANDARD_GRAVITY: 'The Discovery Feed'
  };
  return labels[edition] || 'Recommended';
};

/**
 * THE ORGANIZER
 */
export const organizeFrontPage = (articles: Article[], edition: PublicationEdition = 'STANDARD_GRAVITY') => {
  if (!articles || articles.length === 0) return { hero: [], trending: [], grid: [] };

  const now = Date.now();
  const interests = getUserInterests();
  const candidates = articles.length > MAX_CANDIDATES ? articles.slice(0, MAX_CANDIDATES) : articles;

  // --- STEP 1: SELECT HERO ---
  // Sort ALL candidates by the strict Hero Algorithm (Velocity)
  // Constraint: Must be > 1 hour old.
  let heroPool = candidates
    .map(a => ({ article: a, score: calculateAttentionVelocity(a, now) }))
    .filter(item => item.score !== -1) // Remove fresh content
    .sort((a, b) => b.score - a.score);

  let heroArticle: Article | undefined;

  if (heroPool.length > 0) {
      heroArticle = heroPool[0].article;
  } else {
      // Fallback: If literally every article is < 1 hour old (New Site), pick the absolute highest liked one.
      const fallback = [...candidates].sort((a, b) => {
          const likesA = Array.isArray(a.liked_by) ? a.liked_by.length : 0;
          const likesB = Array.isArray(b.liked_by) ? b.liked_by.length : 0;
          return likesB - likesA;
      });
      heroArticle = fallback[0];
  }

  // --- STEP 2: ORGANIZE REMAINDER ---
  // Remove the chosen Hero from the pool so it doesn't duplicate
  const remainingArticles = candidates.filter(a => a.id !== heroArticle?.id);

  // Score the rest based on the standard algorithm (which allows fresh content)
  const scoredGrid = remainingArticles.map(article => ({
    article,
    // Removed Math.random() to prevent layout jumping when user likes an article
    score: (computeViralScoreOptimized(article, now) * computeRelevanceScore(article, interests))
  }));

  const sortedGrid = scoredGrid
    .sort((a, b) => b.score - a.score)
    .map(s => s.article);

  const hero = heroArticle ? [heroArticle] : [];
  const trending = sortedGrid.slice(0, 3);
  const grid = sortedGrid.slice(3);

  const gridTail = articles.length > MAX_CANDIDATES ? articles.slice(MAX_CANDIDATES) : [];
  const fullGrid = [...grid, ...gridTail];

  return { hero, trending, grid: fullGrid };
};

export const sortVault = (articles: Article[], mode: 'NOTORIETY' | 'CHRONOLOGICAL') => {
  const safeArticles = [...articles];
  const now = Date.now();

  if (mode === 'CHRONOLOGICAL') {
    return safeArticles.sort((a, b) => {
        const timeA = a.created_at ? Date.parse(a.created_at) : 0;
        const timeB = b.created_at ? Date.parse(b.created_at) : 0;
        return timeB - timeA;
    });
  }

  if (safeArticles.length > 1000) {
      const topPool = safeArticles.slice(0, 1000).sort((a, b) => computeViralScoreOptimized(b, now) - computeViralScoreOptimized(a, now));
      const rest = safeArticles.slice(1000); 
      return [...topPool, ...rest];
  }

  return safeArticles.sort((a, b) => computeViralScoreOptimized(b, now) - computeViralScoreOptimized(a, now));
};