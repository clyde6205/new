import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  register: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      phone: z.string().optional(),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
  }),

  updateProfile: z.object({
    body: z.object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      location_lat: z.number().min(-90).max(90).optional(),
      location_lon: z.number().min(-180).max(180).optional(),
    }),
  }),

  createPost: z.object({
    body: z.object({
      content: z.string().min(1).max(5000),
      image_url: z.string().url().optional(),
    }),
  }),

  addContact: z.object({
    body: z.object({
      name: z.string().min(2),
      phone: z.string().min(10),
    }),
  }),

  weatherQuery: z.object({
    query: z.object({
      lat: z.string().transform(Number),
      lon: z.string().transform(Number),
    }),
  }),
};
