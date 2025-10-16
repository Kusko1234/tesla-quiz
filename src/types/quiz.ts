export interface Question {
  id: string;
  question: string;
  options: string[];
  type: 'single' | 'multiple' | 'text';
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

export interface QuizSubmission {
  userInfo: UserInfo;
  quizId: string;
  answers: QuizAnswer[];
  submittedAt: string;
}
