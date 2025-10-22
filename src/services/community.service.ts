import { AppDataSource } from '../config/database';
import { CommunityPost } from '../models/CommunityPost';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { PaginatedResponse } from '../types';

export class CommunityService {
  private postRepository = AppDataSource.getRepository(CommunityPost);
  private userRepository = AppDataSource.getRepository(User);

  async getPosts(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      where: { is_deleted: false },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const postsWithUser = posts.map((post) => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      likes: post.likes,
      created_at: post.created_at,
      user: {
        id: post.user.id,
        name: post.user.name,
        profile_image_url: post.user.profile_image_url,
      },
    }));

    return {
      data: postsWithUser,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPost(postId: string): Promise<any> {
    const post = await this.postRepository.findOne({
      where: { id: postId, is_deleted: false },
      relations: ['user'],
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    return {
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      likes: post.likes,
      created_at: post.created_at,
      user: {
        id: post.user.id,
        name: post.user.name,
        profile_image_url: post.user.profile_image_url,
      },
    };
  }

  async createPost(
    userId: string,
    content: string,
    imageUrl?: string
  ): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const post = this.postRepository.create({
      content,
      image_url: imageUrl,
      user_id: userId,
      likes: 0,
      liked_by_user_ids: [],
    });

    await this.postRepository.save(post);

    return {
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      likes: post.likes,
      created_at: post.created_at,
      user: {
        id: user.id,
        name: user.name,
        profile_image_url: user.profile_image_url,
      },
    };
  }

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likes: number }> {
    const post = await this.postRepository.findOne({
      where: { id: postId, is_deleted: false },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const likedByIds = post.liked_by_user_ids || [];
    const hasLiked = likedByIds.includes(userId);

    if (hasLiked) {
      // Unlike
      post.liked_by_user_ids = likedByIds.filter((id) => id !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      post.liked_by_user_ids = [...likedByIds, userId];
      post.likes += 1;
    }

    await this.postRepository.save(post);

    return {
      liked: !hasLiked,
      likes: post.likes,
    };
  }

  async deletePost(postId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Only post owner or admin can delete
    if (post.user_id !== userId && !isAdmin) {
      throw new AppError('Unauthorized to delete this post', 403);
    }

    // Soft delete
    post.is_deleted = true;
    await this.postRepository.save(post);
  }

  async getUserPosts(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;

    const [posts, total] = await this.postRepository.findAndCount({
      where: { user_id: userId, is_deleted: false },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const postsWithUser = posts.map((post) => ({
      id: post.id,
      content: post.content,
      image_url: post.image_url,
      likes: post.likes,
      created_at: post.created_at,
      user: {
        id: post.user.id,
        name: post.user.name,
        profile_image_url: post.user.profile_image_url,
      },
    }));

    return {
      data: postsWithUser,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
