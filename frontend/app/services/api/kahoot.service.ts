import { apiService } from './api.service.js';
import { getApiBaseUrl } from './api.service.js';
import type { CreateQuestionInput, KahootSession, Question, SessionVisibility, UpdateQuestionInput } from '../../types/kahoot.types.js';

export const kahootService = {
  createSession: (code?: string) => apiService.post<KahootSession>('/sessions', code ? { code } : {}),
  getSession: (code: string) => apiService.get<KahootSession>(`/sessions/${encodeURIComponent(code)}`),
  getSessionQuestions: (code: string) => apiService.get<Question[]>(`/sessions/${encodeURIComponent(code)}/questions`),
  getUserSessions: () => apiService.get<KahootSession[]>('/sessions'),
  createQuestion: (input: CreateQuestionInput) => apiService.post<Question>('/questions', input),
  updateQuestion: (id: string, input: UpdateQuestionInput) => apiService.put<Question>(`/questions/${encodeURIComponent(id)}`, input),
  deleteQuestion: (id: string) => apiService.delete(`/questions/${encodeURIComponent(id)}`),
  updateSessionVisibility: (code: string, visibility: SessionVisibility) => apiService.put<KahootSession>(`/sessions/${encodeURIComponent(code)}/visibility`, { visibility }),
  joinSession: (code: string) => apiService.post(`/sessions/${encodeURIComponent(code)}/join`),
  leaveSession: (code: string) => apiService.post(`/sessions/${encodeURIComponent(code)}/leave`),
  async exportSession(code: string): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/sessions/${encodeURIComponent(code)}/export-kahoot`, { credentials: 'include' });
    if (!response.ok) throw new Error('No se pudo generar el archivo de Kahoot.');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kahoot-${code}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
