import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<{ token: string; refreshToken: string; user: any }> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      subscription_tier: 'free',
      is_active: true,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save refresh token
    user.refresh_token = refreshToken;
    await this.userRepository.save(user);

    return {
      token,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ token: string; refreshToken: string; user: any }> {
    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account is inactive', 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Update user
    user.refresh_token = refreshToken;
    user.last_login_at = new Date();
    await this.userRepository.save(user);

    return {
      token,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;

      // Find user and verify refresh token
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId, refresh_token: refreshToken },
      });

      if (!user || !user.is_active) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const newToken = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Update refresh token
      user.refresh_token = newRefreshToken;
      await this.userRepository.save(user);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return this.sanitizeUser(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // TODO: Implement email sending with reset token
    // For now, just log it
    const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await this.userRepository.findOne({ where: { id: decoded.userId } });

      if (!user) {
        throw new AppError('Invalid reset token', 400);
      }

      // Hash new password
      user.password = await bcrypt.hash(newPassword, 12);
      await this.userRepository.save(user);
    } catch (error) {
      throw new AppError('Invalid or expired reset token', 400);
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as any);
  }

  private sanitizeUser(user: User): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      profile_image_url: user.profile_image_url,
      subscription_tier: user.subscription_tier,
      created_at: user.created_at,
    };
  }
}
