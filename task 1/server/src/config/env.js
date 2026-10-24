import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  trustProxy: process.env.TRUST_PROXY === 'true',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meetflow',
  jwtSecret: process.env.JWT_SECRET || 'meetflow_dev_jwt_secret_key_2026_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtTempSecret: process.env.JWT_TEMP_SECRET || 'meetflow_dev_temp_otp_token_secret_2026',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'MeetFlow Security <noreply@meetflow.com>',
  },
  geolocationApiUrl: process.env.GEOLOCATION_API_URL || '',
};
