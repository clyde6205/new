import axios from 'axios';
import { WeatherProvider, WeatherData, ForecastData } from '../types';
import { cacheGet, cacheSet } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

export class WeatherService {
  private providers: Map<WeatherProvider, any> = new Map();

  constructor() {
    // Initialize providers
    this.providers.set('openweathermap', {
      apiKey: process.env.OPENWEATHER_API_KEY,
      baseUrl: process.env.OPENWEATHER_BASE_URL,
    });
    this.providers.set('weatherapi', {
      apiKey: process.env.WEATHERAPI_KEY,
      baseUrl: process.env.WEATHERAPI_BASE_URL,
    });
    this.providers.set('visualcrossing', {
      apiKey: process.env.VISUALCROSSING_API_KEY,
      baseUrl: process.env.VISUALCROSSING_BASE_URL,
    });
  }

  async getCurrentWeather(
    lat: number,
    lon: number,
    provider?: WeatherProvider
  ): Promise<WeatherData> {
    const selectedProvider = provider || (process.env.DEFAULT_WEATHER_PROVIDER as WeatherProvider) || 'openweathermap';
    const cacheKey = `weather:current:${lat}:${lon}:${selectedProvider}`;

    // Try cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from provider
    let weatherData: WeatherData;
    try {
      switch (selectedProvider) {
        case 'openweathermap':
          weatherData = await this.fetchOpenWeatherMapCurrent(lat, lon);
          break;
        case 'weatherapi':
          weatherData = await this.fetchWeatherAPICurrent(lat, lon);
          break;
        case 'visualcrossing':
          weatherData = await this.fetchVisualCrossingCurrent(lat, lon);
          break;
        default:
          throw new AppError('Invalid weather provider', 400);
      }

      // Cache for 10 minutes
      await cacheSet(cacheKey, JSON.stringify(weatherData), 600);
      return weatherData;
    } catch (error: any) {
      logger.error('Weather fetch error:', error);
      throw new AppError('Failed to fetch weather data', 500);
    }
  }

  async getForecast(
    lat: number,
    lon: number,
    provider?: WeatherProvider
  ): Promise<ForecastData[]> {
    const selectedProvider = provider || (process.env.DEFAULT_WEATHER_PROVIDER as WeatherProvider) || 'openweathermap';
    const cacheKey = `weather:forecast:${lat}:${lon}:${selectedProvider}`;

    // Try cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from provider
    let forecastData: ForecastData[];
    try {
      switch (selectedProvider) {
        case 'openweathermap':
          forecastData = await this.fetchOpenWeatherMapForecast(lat, lon);
          break;
        case 'weatherapi':
          forecastData = await this.fetchWeatherAPIForecast(lat, lon);
          break;
        case 'visualcrossing':
          forecastData = await this.fetchVisualCrossingForecast(lat, lon);
          break;
        default:
          throw new AppError('Invalid weather provider', 400);
      }

      // Cache for 1 hour
      await cacheSet(cacheKey, JSON.stringify(forecastData), 3600);
      return forecastData;
    } catch (error: any) {
      logger.error('Forecast fetch error:', error);
      throw new AppError('Failed to fetch forecast data', 500);
    }
  }

  // OpenWeatherMap implementation
  private async fetchOpenWeatherMapCurrent(lat: number, lon: number): Promise<WeatherData> {
    const config = this.providers.get('openweathermap');
    const url = `${config.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${config.apiKey}&units=metric`;

    const response = await axios.get(url);
    const data = response.data;

    return {
      temperature: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind_speed: data.wind.speed,
      wind_direction: data.wind.deg,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      timestamp: new Date().toISOString(),
    };
  }

  private async fetchOpenWeatherMapForecast(lat: number, lon: number): Promise<ForecastData[]> {
    const config = this.providers.get('openweathermap');
    const url = `${config.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${config.apiKey}&units=metric`;

    const response = await axios.get(url);
    const data = response.data;

    // Group by day and get daily forecast
    const dailyData: { [key: string]: any[] } = {};
    data.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(item);
    });

    return Object.keys(dailyData).slice(0, 7).map((date) => {
      const dayData = dailyData[date];
      const temps = dayData.map((d) => d.main.temp);
      const precipitation = dayData.reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0);

      return {
        date,
        temp_max: Math.max(...temps),
        temp_min: Math.min(...temps),
        humidity: dayData[0].main.humidity,
        precipitation,
        wind_speed: dayData[0].wind.speed,
        description: dayData[0].weather[0].description,
        icon: dayData[0].weather[0].icon,
      };
    });
  }

  // WeatherAPI.com implementation
  private async fetchWeatherAPICurrent(lat: number, lon: number): Promise<WeatherData> {
    const config = this.providers.get('weatherapi');
    const url = `${config.baseUrl}/current.json?key=${config.apiKey}&q=${lat},${lon}`;

    const response = await axios.get(url);
    const data = response.data.current;

    return {
      temperature: data.temp_c,
      feels_like: data.feelslike_c,
      humidity: data.humidity,
      pressure: data.pressure_mb,
      wind_speed: data.wind_kph / 3.6, // Convert to m/s
      wind_direction: data.wind_degree,
      description: data.condition.text,
      icon: data.condition.icon,
      timestamp: new Date().toISOString(),
    };
  }

  private async fetchWeatherAPIForecast(lat: number, lon: number): Promise<ForecastData[]> {
    const config = this.providers.get('weatherapi');
    const url = `${config.baseUrl}/forecast.json?key=${config.apiKey}&q=${lat},${lon}&days=7`;

    const response = await axios.get(url);
    const data = response.data.forecast.forecastday;

    return data.map((day: any) => ({
      date: day.date,
      temp_max: day.day.maxtemp_c,
      temp_min: day.day.mintemp_c,
      humidity: day.day.avghumidity,
      precipitation: day.day.totalprecip_mm,
      wind_speed: day.day.maxwind_kph / 3.6,
      description: day.day.condition.text,
      icon: day.day.condition.icon,
    }));
  }

  // Visual Crossing implementation
  private async fetchVisualCrossingCurrent(lat: number, lon: number): Promise<WeatherData> {
    const config = this.providers.get('visualcrossing');
    const url = `${config.baseUrl}/timeline/${lat},${lon}/today?key=${config.apiKey}&unitGroup=metric`;

    const response = await axios.get(url);
    const data = response.data.currentConditions;

    return {
      temperature: data.temp,
      feels_like: data.feelslike,
      humidity: data.humidity,
      pressure: data.pressure,
      wind_speed: data.windspeed / 3.6,
      wind_direction: data.winddir,
      description: data.conditions,
      icon: data.icon,
      timestamp: new Date().toISOString(),
    };
  }

  private async fetchVisualCrossingForecast(lat: number, lon: number): Promise<ForecastData[]> {
    const config = this.providers.get('visualcrossing');
    const url = `${config.baseUrl}/timeline/${lat},${lon}/next7days?key=${config.apiKey}&unitGroup=metric`;

    const response = await axios.get(url);
    const data = response.data.days;

    return data.map((day: any) => ({
      date: day.datetime,
      temp_max: day.tempmax,
      temp_min: day.tempmin,
      humidity: day.humidity,
      precipitation: day.precip,
      wind_speed: day.windspeed / 3.6,
      description: day.conditions,
      icon: day.icon,
    }));
  }
}
