import { Question } from '@/types/quiz';

interface CachedQuiz {
  id: string;
  title: string;
  questions: Question[];
  cachedAt: string;
}

const CACHE_KEY_PREFIX = 'quiz-cache-';

export const cacheQuiz = (quizId: string, title: string, questions: Question[]): void => {
  try {
    const cachedQuiz: CachedQuiz = {
      id: quizId,
      title,
      questions,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${quizId}`, JSON.stringify(cachedQuiz));
    console.log('Quiz cached:', quizId);
  } catch (error) {
    console.error('Error caching quiz:', error);
  }
};

export const getCachedQuiz = (quizId: string): CachedQuiz | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${quizId}`);
    if (!cached) return null;
    return JSON.parse(cached) as CachedQuiz;
  } catch (error) {
    console.error('Error retrieving cached quiz:', error);
    return null;
  }
};

export const clearQuizCache = (quizId: string): void => {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${quizId}`);
    console.log('Quiz cache cleared:', quizId);
  } catch (error) {
    console.error('Error clearing quiz cache:', error);
  }
};
