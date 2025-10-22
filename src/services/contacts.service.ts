import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

export class ContactsService {
  private contactRepository = AppDataSource.getRepository(Contact);
  private userRepository = AppDataSource.getRepository(User);

  async getContacts(userId: string): Promise<{ contacts: any[] }> {
    const contacts = await this.contactRepository.find({
      where: { user_id: userId },
      order: { name: 'ASC' },
    });

    return {
      contacts: contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        created_at: contact.created_at,
      })),
    };
  }

  async addContact(userId: string, name: string, phone: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const contact = this.contactRepository.create({
      name,
      phone,
      user_id: userId,
    });

    await this.contactRepository.save(contact);

    return {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      created_at: contact.created_at,
    };
  }

  async updateContact(
    contactId: string,
    userId: string,
    data: { name?: string; phone?: string }
  ): Promise<any> {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId, user_id: userId },
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    if (data.name !== undefined) contact.name = data.name;
    if (data.phone !== undefined) contact.phone = data.phone;

    await this.contactRepository.save(contact);

    return {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      created_at: contact.created_at,
    };
  }

  async deleteContact(contactId: string, userId: string): Promise<void> {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId, user_id: userId },
    });

    if (!contact) {
      throw new AppError('Contact not found', 404);
    }

    await this.contactRepository.remove(contact);
  }
}
