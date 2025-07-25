import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserProfile, JWTPayload } from '../types';

const { User } = require('../../models');

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    experience?: string;
    learningGoals?: string;
    industry?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: userData.email } });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        preferences: {
          dailyTimeGoal: 30,
          difficulty: 'medium',
          topics: [],
          reminderTime: '09:00'
        }
      });

      // Generate token
      const token = this.generateToken(user);

      // Return user without password
      const userProfile = this.sanitizeUser(user);

      return { user: userProfile, token };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    try {
      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last active
      await user.update({ lastActive: new Date() });

      // Generate token
      const token = this.generateToken(user);

      // Return user without password
      const userProfile = this.sanitizeUser(user);

      return { user: userProfile, token };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async refreshToken(userId: string): Promise<string> {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return this.generateToken(user);
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const user = await User.findByPk(userId);
      if (!user) return null;

      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update(updates);
      return this.sanitizeUser(user);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await user.update({ password: hashedPassword });
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ isActive: false });
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private generateToken(user: any): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  private sanitizeUser(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      experience: user.experience,
      learningGoals: user.learningGoals,
      industry: user.industry,
      preferences: user.preferences,
      lastActive: user.lastActive,
      isActive: user.isActive
    };
  }
}