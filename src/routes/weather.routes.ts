import { Router } from 'express';
import { WeatherController } from '../controllers/weather.controller';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { weatherLimiter } from '../middleware/rateLimit';

const router = Router();
const weatherController = new WeatherController();

// All weather routes require authentication
router.use(authenticate);
router.use(weatherLimiter);

router.get('/current', validate(schemas.weatherQuery), weatherController.getCurrentWeather.bind(weatherController));
router.get('/forecast', validate(schemas.weatherQuery), weatherController.getForecast.bind(weatherController));

export default router;
