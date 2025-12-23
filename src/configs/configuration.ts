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
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  },

  //   throttler: {
  //     ttl: 0,
  //     limit: 10,
  //   }, // 1 user được gửi 10 request trong 60s
});
