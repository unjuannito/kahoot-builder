export const KAHOOT_TIMES = [5, 10, 20, 30, 60, 90, 120] as const;

export type SessionVisibility = 'all_questions' | 'only_own' | 'only_own_owner_sees_all';

export interface KahootSession {
  id: string;
  code: string;
  visibility: SessionVisibility;
  created_at: string;
  expires_at?: string;
}

export interface Question {
  id: string;
  session_id: string;
  user_id: string;
  user_name?: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  time: number;
  correct: string;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionInput {
  session_id: string;
  user_id: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  time: number;
  correct: string;
}

export interface UpdateQuestionInput {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  time: number;
  correct: string;
}

export interface SessionUser {
  id: string;
  session_id: string;
  user_id: string;
  is_owner: boolean;
  joined_at: string;
  left_at?: string;
}
