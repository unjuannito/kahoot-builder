import { Router } from 'express';
import { KahootRepository } from '../db/repositories/kahoot.repository.js';
import { ShareImageService, parseShareLanguage } from '../services/share-image.service.js';

const router = Router();
const imageHeaders = { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400', 'X-Content-Type-Options': 'nosniff' };

router.get('/home.png', (req, res, next) => {
  ShareImageService.home(parseShareLanguage(req.query.lang)).then((png) => res.set(imageHeaders).send(png)).catch(next);
});

router.get('/session/:code.png', (req, res, next) => {
  const session = KahootRepository.findSessionByCode(req.params.code);
  if (!session || (session.expires_at && new Date(session.expires_at) <= new Date())) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  ShareImageService.session({ ...session, question_count: KahootRepository.countQuestionsBySession(session.id), owner_name: KahootRepository.findSessionOwnerName(session.id) }, parseShareLanguage(req.query.lang))
    .then((png) => res.set(imageHeaders).send(png)).catch(next);
});

export default router;
