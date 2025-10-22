import { Request } from 'express';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscription_tier: string;
    is_admin: boolean;
  };
}

// Weather Provider Types
export type WeatherProvider = 'openweathermap' | 'weatherapi' | 'visualcrossing';

export interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  description: string;
  icon: string;
  timestamp: string;
}

export interface ForecastData {
  date: string;
  temp_max: number;
  temp_min: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  description: string;
  icon: string;
}

// Payment Types
export interface PaymentIntent {
  provider: string;
  amount: number;
  currency: string;
  tier_id: string;
  metadata?: any;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  weather_provider: WeatherProvider;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
