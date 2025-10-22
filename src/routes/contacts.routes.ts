import { Router } from 'express';
import { ContactsController } from '../controllers/contacts.controller';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();
const contactsController = new ContactsController();

// All contacts routes require authentication
router.use(authenticate);

router.get('/', contactsController.getContacts.bind(contactsController));
router.post('/', validate(schemas.addContact), contactsController.addContact.bind(contactsController));
router.put('/:id', contactsController.updateContact.bind(contactsController));
router.delete('/:id', contactsController.deleteContact.bind(contactsController));

export default router;
