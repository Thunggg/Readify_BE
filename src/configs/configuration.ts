export default () => ({
  // App
  env: process.env.NODE_ENV,
  port: process.env.PORT,

  // Database
  database: {
    uri: process.env.MONGODB_URI ?? process.env.DATABASE_URL,
    options: {
      autoIndex: process.env.NODE_ENV !== 'production', // Tắt index tạm thời trong production
      maxPoolSize: 10, // Giới hạn số lượng connection tối đa
      serverSelectionTimeoutMS: 5000, // Thời gian chờ chọn server
      socketTimeoutMS: 45000, // Thời gian chờ socket
      family: 4, // Dùng IPv4
    },
  },

  // JWT
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN ?? 3600),
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN ?? 3600),
  },

  // Bcrypt
  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  // Mail
  mail: {
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
  },

  // OTP
  otp: {
    expiresInMinutes: Number(process.env.OTP_EXPIRES_IN_MINUTES ?? 5),
    cooldownMs: Number(process.env.OTP_COOLDOWN_MS ?? 60_000),
    blockMs: Number(process.env.OTP_BLOCK_MS ?? 15 * 60_000),
    maxResendCount: Number(process.env.OTP_MAX_RESEND_COUNT ?? 10),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 10),
  },

  // Pending Registration
  pendingRegistration: {
    expiresInMinutes: Number(process.env.PENDING_REGISTRATION_EXPIRES_IN_MINUTES ?? 15),
  },
});
