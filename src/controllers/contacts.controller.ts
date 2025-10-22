import { Response } from 'express';
import { AuthRequest } from '../types';
import { ContactsService } from '../services/contacts.service';

const contactsService = new ContactsService();

export class ContactsController {
  async getContacts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await contactsService.getContacts(req.user!.id);

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

  async addContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, phone } = req.body;
      const contact = await contactsService.addContact(req.user!.id, name, phone);

      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async updateContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const contact = await contactsService.updateContact(id, req.user!.id, req.body);

      res.json({
        success: true,
        data: contact,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteContact(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await contactsService.deleteContact(id, req.user!.id);

      res.json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
