import { randomBytes } from 'node:crypto';
import { Request, Response } from 'express';
import { KahootRepository } from '../db/repositories/kahoot.repository.js';
import { createKahootWorkbook } from '../services/excel.service.js';

const isSessionExpired = (session: any): boolean => {
  if (!session.expires_at) return false;
  return new Date(session.expires_at) <= new Date();
};

const getSession = (code: string) => KahootRepository.findSessionByCode(code);

export const KahootController = {
  listUserSessions(req: any, res: Response) { res.json(KahootRepository.findSessionsByUser(req.user.userId)); },
  createSession(req: any, res: Response) {
    const code = req.body.code || randomBytes(4).toString('hex').toUpperCase();
    if (KahootRepository.findSessionByCode(code)) return res.status(409).json({ error: 'Session code already exists' });
    res.status(201).json(KahootRepository.createSession(code, req.user.userId));
  },

  getSession(req: any, res: Response) {
    const session = getSession(req.params.code);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (isSessionExpired(session)) return res.status(404).json({ error: 'Session not found' });
    const sessionUser = KahootRepository.findSessionUser(session.id, req.user.userId);
    res.json({ ...session, is_owner: sessionUser?.is_owner });
  },

  listQuestions(req: any, res: Response) {
    const session = getSession(req.params.code);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (isSessionExpired(session)) return res.status(404).json({ error: 'Session not found' });
    res.json(KahootRepository.findQuestionsBySession(session.id, req.user.userId));
  },

  createQuestion(req: any, res: Response) {
    const session = KahootRepository.findSessionById(req.body.session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (isSessionExpired(session)) return res.status(404).json({ error: 'Session not found' });
    res.status(201).json(KahootRepository.createQuestion({ ...req.body, user_id: req.user.userId }));
  },

  updateQuestion(req: any, res: Response) {
    const questionId = req.params.id;
    const question = KahootRepository.findQuestionById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.user_id !== req.user.userId) return res.status(403).json({ error: 'You can only edit your own questions' });
    const updatedQuestion = KahootRepository.updateQuestion(questionId, req.body);
    res.json(updatedQuestion);
  },

  deleteQuestion(req: any, res: Response) {
    const questionId = req.params.id;
    const question = KahootRepository.findQuestionById(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.user_id !== req.user.userId) return res.status(403).json({ error: 'You can only delete your own questions' });
    KahootRepository.deleteQuestion(questionId);
    res.status(204).send();
  },

  updateVisibility(req: any, res: Response) {
    const session = getSession(req.params.code);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (isSessionExpired(session)) return res.status(404).json({ error: 'Session not found' });
    const sessionUser = KahootRepository.findSessionUser(session.id, req.user.userId);
    if (!sessionUser?.is_owner) return res.status(403).json({ error: 'Only owner can change visibility' });
    const updatedSession = KahootRepository.updateSessionVisibility(session.id, req.body.visibility);
    res.json({ ...updatedSession, is_owner: sessionUser?.is_owner });
  },

  async exportKahoot(req: Request, res: Response) {
    const session = getSession(req.params.code);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (isSessionExpired(session)) return res.status(404).json({ error: 'Session not found' });
    const workbook = await createKahootWorkbook(KahootRepository.findQuestionsBySession(session.id));
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="kahoot-${session.code}.xlsx"`,
    });
    res.send(workbook);
  },

  joinSession(req: any, res: Response) {
    const session = getSession(req.params.code);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (isSessionExpired(session)) return res.status(404).json({ error: 'Session not found' });
    res.status(201).json(KahootRepository.joinSession(session.id, req.user.userId));
  },

  leaveSession(req: any, res: Response) {
    const session = getSession(req.params.code);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (isSessionExpired(session)) return res.status(404).json({ error: 'Session not found' });
    KahootRepository.leaveSession(session.id, req.user.userId);
    res.status(204).send();
  },

  listSessionUsers(req: Request, res: Response) {
    const session = getSession(req.params.code);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (isSessionExpired(session)) return res.status(404).json({ error: 'Session not found' });
    res.json(KahootRepository.findSessionUsersBySession(session.id));
  },
};
