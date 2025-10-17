// IndexedDB helper for offline storage
const DB_NAME = 'quiz-platform-db';
const DB_VERSION = 1;
const STORE_NAME = 'quiz-submissions';

interface StoredSubmission {
  id: string;
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  quizId: string;
  quizTitle: string;
  answers: Array<{
    questionId: string;
    question: string;
    answer: string | string[];
  }>;
  consents: {
    terms: boolean;
    marketing: boolean;
    gdpr: boolean;
  };
  submittedAt: string;
  synced: boolean;
  createdAt: string;
}

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveSubmissionOffline = async (submission: Omit<StoredSubmission, 'id' | 'synced' | 'createdAt'>): Promise<string> => {
  const database = await initDB();
  const id = `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const storedSubmission: StoredSubmission = {
    id,
    ...submission,
    synced: false,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(storedSubmission);

    request.onerror = () => {
      console.error('Error saving submission:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Submission saved offline:', id);
      resolve(id);
    };
  });
};

export const getUnsyncedSubmissions = async (): Promise<StoredSubmission[]> => {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
      console.error('Error fetching submissions:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const submissions = (request.result as StoredSubmission[]).filter(s => !s.synced);
      resolve(submissions);
    };
  });
};

export const markSubmissionSynced = async (id: string): Promise<void> => {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onerror = () => {
      console.error('Error getting submission:', getRequest.error);
      reject(getRequest.error);
    };

    getRequest.onsuccess = () => {
      const submission = getRequest.result as StoredSubmission;
      submission.synced = true;

      const putRequest = store.put(submission);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    };
  });
};

export const clearAllSubmissions = async (): Promise<void> => {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};
