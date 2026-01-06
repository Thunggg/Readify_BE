import * as Joi from 'joi';

export const validateEnv = Joi.object({
  MONGODB_URI: Joi.string().required(),
  ACCESS_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  ACCESS_TOKEN_EXPIRES_IN: Joi.number().integer().positive().required(),
  REFRESH_TOKEN_EXPIRES_IN: Joi.number().integer().positive().required(),
  PORT: Joi.number().required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  BCRYPT_SALT_ROUNDS: Joi.number().required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  MAIL_USER: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.allow('').optional()
  }),
  MAIL_PASS: Joi.string().when('NODE_ENV', {
    is: 'production', 
    then: Joi.required(),
    otherwise: Joi.allow('').optional()
  }),
  FRONTEND_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

  // OTP (optional; defaults are applied in configuration.ts)
  OTP_EXPIRES_IN_MINUTES: Joi.number().integer().positive().optional(),
  OTP_COOLDOWN_MS: Joi.number().integer().positive().optional(),
  OTP_BLOCK_MS: Joi.number().integer().positive().optional(),
  OTP_MAX_RESEND_COUNT: Joi.number().integer().positive().optional(),
  OTP_MAX_ATTEMPTS: Joi.number().integer().positive().optional(),

  // Pending Registration
  PENDING_REGISTRATION_EXPIRES_IN_MINUTES: Joi.number().integer().positive().optional(),
});
