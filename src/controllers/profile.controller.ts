import { Response } from 'express';
import { AuthRequest } from '../types';
import { ProfileService } from '../services/profile.service';
import multer from 'multer';
import path from 'path';

const profileService = new ProfileService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/profiles/',
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

export class ProfileController {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const profile = await profileService.getProfile(req.user!.id);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const profile = await profileService.updateProfile(req.user!.id, req.body);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async uploadImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
        return;
      }

      // In production, upload to S3 or CDN
      // For now, use local path
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      const result = await profileService.uploadProfileImage(req.user!.id, imageUrl);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      await profileService.deleteAccount(req.user!.id);

      res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
