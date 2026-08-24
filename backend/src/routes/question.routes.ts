import { Router } from 'express';
import { KahootController } from '../controllers/kahoot.controller.js';
import { validateRequest } from '../middleware/validate.js';
import { createQuestionSchema, createSessionSchema, updateQuestionSchema, questionIdParamSchema } from '../validators/question.validator.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Las salas y sus preguntas solo están disponibles para usuarios autenticados.
// Esto también protege la API frente a clientes que intenten saltarse el frontend.
router.use(authMiddleware);

router.post('/sessions', validateRequest(createSessionSchema), KahootController.createSession);
router.get('/sessions', KahootController.listUserSessions);
router.get('/sessions/:code', KahootController.getSession);
router.get('/sessions/:code/questions', KahootController.listQuestions);
router.post('/questions', validateRequest(createQuestionSchema), KahootController.createQuestion);
router.put('/questions/:id', validateRequest({ params: questionIdParamSchema, body: updateQuestionSchema }), KahootController.updateQuestion);
router.delete('/questions/:id', validateRequest({ params: questionIdParamSchema }), KahootController.deleteQuestion);
router.put('/sessions/:code/visibility', KahootController.updateVisibility);
router.put('/sessions/:code/close', KahootController.closeSession);
router.put('/sessions/:code/reopen', KahootController.reopenSession);
router.get('/sessions/:code/export-kahoot', KahootController.exportKahoot);
router.post('/sessions/:code/join', KahootController.joinSession);
router.post('/sessions/:code/leave', KahootController.leaveSession);
router.get('/sessions/:code/users', KahootController.listSessionUsers);

export default router;
