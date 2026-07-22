import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../types/errors.js';

export class ValidationError extends AppError {
  public details: Array<{ path: string; message: string }>;

  constructor(zodError: ZodError) {
    super('VALIDATION_ERROR', 'Validation failed', 400);
    this.details = zodError.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));
  }
}

interface ValidateRequestOptions {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export const validateRequest = (schemaOrOptions: AnyZodObject | ValidateRequestOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let schema: AnyZodObject;
      
      if ('body' in schemaOrOptions || 'query' in schemaOrOptions || 'params' in schemaOrOptions) {
        // It's an options object, build a combined schema
        const parts: Record<string, AnyZodObject> = {};
        if (schemaOrOptions.body) parts.body = schemaOrOptions.body;
        if (schemaOrOptions.query) parts.query = schemaOrOptions.query;
        if (schemaOrOptions.params) parts.params = schemaOrOptions.params;
        
        // Validate each part individually
        if (schemaOrOptions.body) await schemaOrOptions.body.parseAsync(req.body);
        if (schemaOrOptions.query) await schemaOrOptions.query.parseAsync(req.query);
        if (schemaOrOptions.params) await schemaOrOptions.params.parseAsync(req.params);
      } else {
        // It's a single schema, check if it expects body/query/params or just body
        const singleSchema = schemaOrOptions as AnyZodObject;
        const schemaShape = singleSchema.shape;
        if (schemaShape.body || schemaShape.query || schemaShape.params) {
          await singleSchema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
          });
        } else {
          // Assume it's a body schema
          await singleSchema.parseAsync(req.body);
        }
      }
      
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError(error));
      }
      next(error);
    }
  };
};
