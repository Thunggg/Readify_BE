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
});
