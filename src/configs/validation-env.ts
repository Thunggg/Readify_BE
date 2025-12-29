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
  // VNPay (optional - only required if using VNPay)
  VNPAY_TMN_CODE: Joi.string().optional(),
  VNPAY_SECRET_KEY: Joi.string().optional(),
  VNPAY_RETURN_URL: Joi.string().uri().optional(),
  VNPAY_IPN_URL: Joi.string().uri().optional(),
  VNPAY_URL: Joi.string().uri().optional(),
  FRONTEND_URL: Joi.string().uri().optional(),
});
