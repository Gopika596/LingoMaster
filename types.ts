export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface UserConfig {
  nativeLanguage: string;
  scenario: string;
}

export interface Session {
  id: string;
  config: UserConfig;
  messages: Message[];
  lastUpdated: number;
}

export enum AppState {
  SETUP = 'SETUP',
  CHAT = 'CHAT',
  VOCABULARY = 'VOCABULARY',
  ENDED = 'ENDED'
}

export interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  translation: string;
  example: string;
  mastery: number; // 0 to 100
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-in-the-blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  wordId: string;
}
