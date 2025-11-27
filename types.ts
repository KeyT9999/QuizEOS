export type OptionLabel = 'A' | 'B' | 'C' | 'D';

export interface QuizOption {
  id: string;
  label: OptionLabel;
  text: string;
}

export interface QuizQuestion {
  id: string;
  order: number;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  userId: string; // User who owns this quiz
  title: string;
  description?: string;
  questions: QuizQuestion[];
  createdAt: number;
  isPublic?: boolean; // If true, quiz can be viewed by all users
  publicUrl?: string; // URL to share the quiz
}

export interface QuizAttempt {
  quizId: string;
  answers: Record<string, string>; // questionId -> optionId
  score: number;
  total: number;
  completedAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}
