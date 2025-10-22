import { Response } from 'express';
import { AuthRequest } from '../types';
import { CommunityService } from '../services/community.service';

const communityService = new CommunityService();

export class CommunityController {
  async getPosts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await communityService.getPosts(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getPost(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const post = await communityService.getPost(id);

      res.json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async createPost(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { content, image_url } = req.body;
      const post = await communityService.createPost(req.user!.id, content, image_url);

      res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async toggleLike(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await communityService.toggleLike(id, req.user!.id);

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

  async deletePost(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await communityService.deletePost(id, req.user!.id, req.user!.is_admin);

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
