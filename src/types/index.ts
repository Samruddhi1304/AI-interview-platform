// User Types
export interface User {
  id: string;
  name: string;
  email: string;
}

// Interview Types
export type InterviewCategory = 'DSA' | 'Web Development' | 'HR' | 'System Design';
export type InterviewDifficulty = 'Easy' | 'Medium' | 'Hard';
export type InterviewDuration = 'Short' | 'Medium' | 'Long';

export interface InterviewQuestion {
  id: string;
  text: string;
  expectedAnswerPoints?: string[];
}

export interface InterviewSession {
  id: string;
  category: InterviewCategory;
  difficulty: InterviewDifficulty;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number; // in seconds
}

// Results Types
export interface QuestionResult {
  id: string;
  text: string;
  userAnswer: string;
  feedback: string;
  score: number;
  keyPoints: {
    text: string;
    met: boolean;
  }[];
}

export interface InterviewResult {
  id: string;
  category: InterviewCategory;
  difficulty: InterviewDifficulty;
  date: string;
  duration: string;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  questions: QuestionResult[];
}