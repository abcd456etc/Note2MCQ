
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  type: 'text' | 'image';
}

export interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  id: string;
  questions: Question[];
  createdAt: Date;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export type View = 'dashboard' | 'quiz' | 'chat' | 'history';
