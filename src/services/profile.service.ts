import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

export class ProfileService {
  private userRepository = AppDataSource.getRepository(User);

  async getProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      profile_image_url: user.profile_image_url,
      location_lat: user.location_lat,
      location_lon: user.location_lon,
      subscription_tier: user.subscription_tier,
      created_at: user.created_at,
    };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      location_lat?: number;
      location_lon?: number;
    }
  ): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.location_lat !== undefined) user.location_lat = data.location_lat;
    if (data.location_lon !== undefined) user.location_lon = data.location_lon;

    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      profile_image_url: user.profile_image_url,
      location_lat: user.location_lat,
      location_lon: user.location_lon,
      subscription_tier: user.subscription_tier,
      created_at: user.created_at,
    };
  }

  async uploadProfileImage(userId: string, imageUrl: string): Promise<{ profile_image_url: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.profile_image_url = imageUrl;
    await this.userRepository.save(user);

    return { profile_image_url: imageUrl };
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Soft delete - deactivate account
    user.is_active = false;
    await this.userRepository.save(user);
  }
}
