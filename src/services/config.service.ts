import { AppDataSource } from '../config/database';
import { AppConfig } from '../models/AppConfig';
import { AppError } from '../middleware/errorHandler';
import { cacheGet, cacheSet, cacheDel } from '../config/redis';

export class ConfigService {
  private configRepository = AppDataSource.getRepository(AppConfig);

  async getConfig(configKey: string): Promise<any> {
    // Try cache first
    const cacheKey = `config:${configKey}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const config = await this.configRepository.findOne({
      where: { config_key: configKey },
    });

    if (!config) {
      throw new AppError('Configuration not found', 404);
    }

    // Cache for 1 hour
    await cacheSet(cacheKey, JSON.stringify(config.config_value), 3600);

    return config.config_value;
  }

  async getAllConfigs(): Promise<{ [key: string]: any }> {
    const configs = await this.configRepository.find();
    const result: { [key: string]: any } = {};

    configs.forEach((config) => {
      result[config.config_key] = config.config_value;
    });

    return result;
  }

  async setConfig(
    configKey: string,
    configValue: any,
    description?: string
  ): Promise<void> {
    let config = await this.configRepository.findOne({
      where: { config_key: configKey },
    });

    if (config) {
      config.config_value = configValue;
      if (description) config.description = description;
    } else {
      config = this.configRepository.create({
        config_key: configKey,
        config_value: configValue,
        description,
      });
    }

    await this.configRepository.save(config);

    // Invalidate cache
    await cacheDel(`config:${configKey}`);
  }

  async deleteConfig(configKey: string): Promise<void> {
    const config = await this.configRepository.findOne({
      where: { config_key: configKey },
    });

    if (!config) {
      throw new AppError('Configuration not found', 404);
    }

    await this.configRepository.remove(config);
    await cacheDel(`config:${configKey}`);
  }

  // Initialize default configs
  async initializeDefaults(): Promise<void> {
    const defaults = [
      {
        key: 'weather_provider',
        value: { default: 'openweathermap', free: 'openweathermap', premium: 'weatherapi', upgrade: 'visualcrossing' },
        description: 'Weather provider configuration by subscription tier',
      },
      {
        key: 'subscription_tiers',
        value: {
          free: { price: 0, features: ['Basic weather', 'Community access'] },
          premium: { price: 4.99, features: ['Advanced weather', 'No ads', 'Priority support'] },
          upgrade: { price: 9.99, features: ['All features', 'Premium weather data', 'Offline sync'] },
        },
        description: 'Subscription tier definitions',
      },
      {
        key: 'app_version',
        value: { min: '1.0.0', latest: '1.0.0' },
        description: 'App version requirements',
      },
    ];

    for (const def of defaults) {
      const existing = await this.configRepository.findOne({
        where: { config_key: def.key },
      });

      if (!existing) {
        await this.setConfig(def.key, def.value, def.description);
      }
    }
  }
}
