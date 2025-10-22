import { Router } from 'express';
import { CommunityController } from '../controllers/community.controller';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();
const communityController = new CommunityController();

// All community routes require authentication
router.use(authenticate);

router.get('/posts', communityController.getPosts.bind(communityController));
router.get('/posts/:id', communityController.getPost.bind(communityController));
router.post('/posts', validate(schemas.createPost), communityController.createPost.bind(communityController));
router.post('/posts/:id/like', communityController.toggleLike.bind(communityController));
router.delete('/posts/:id', communityController.deletePost.bind(communityController));

export default router;
