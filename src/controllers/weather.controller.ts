import { Response } from 'express';
import { AuthRequest } from '../types';
import { WeatherService } from '../services/weather.service';

const weatherService = new WeatherService();

export class WeatherController {
  async getCurrentWeather(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lat, lon } = req.query;
      const provider = req.user?.subscription_tier === 'upgrade' ? 'visualcrossing' :
                      req.user?.subscription_tier === 'premium' ? 'weatherapi' :
                      'openweathermap';

      const weather = await weatherService.getCurrentWeather(
        Number(lat),
        Number(lon),
        provider as any
      );

      res.json({
        success: true,
        data: weather,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getForecast(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lat, lon } = req.query;
      const provider = req.user?.subscription_tier === 'upgrade' ? 'visualcrossing' :
                      req.user?.subscription_tier === 'premium' ? 'weatherapi' :
                      'openweathermap';

      const forecast = await weatherService.getForecast(
        Number(lat),
        Number(lon),
        provider as any
      );

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
