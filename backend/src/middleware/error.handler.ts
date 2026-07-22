import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors.js';
import { ValidationError } from './validate.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  if (err instanceof ValidationError) {
    res.status(err.status).json({
      code: err.code,
      error: err.message,
      details: err.details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else if (err instanceof AppError) {
    res.status(err.status).json({
      code: err.code,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    // For unexpected errors
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
      code: 'INTERNAL_ERROR',
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};
