import { Router } from 'express';
import { ProfileController, upload } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();
const profileController = new ProfileController();

// All profile routes require authentication
router.use(authenticate);

router.get('/', profileController.getProfile.bind(profileController));
router.put('/', validate(schemas.updateProfile), profileController.updateProfile.bind(profileController));
router.post('/image', upload.single('image'), profileController.uploadImage.bind(profileController));
router.delete('/account', profileController.deleteAccount.bind(profileController));

export default router;
