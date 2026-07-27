/**
 * Environment Configuration
 * Centralized, type-safe environment variable management
 * Validates configuration on app startup to prevent runtime errors
 */

import Config from 'react-native-config';

export interface AppConfig {
  // Agora Configuration
  agoraAppId: string;
  agoraAppCertificate: string;

  // Backend API
  apiBaseUrl: string;
  apiTimeout: number;

  // Environment
  nodeEnv: 'development' | 'production' | 'test';

  // Feature Flags
  enableRecording: boolean;
  enableScreenShare: boolean;
  enableChat: boolean;
  enableWaitingRoom: boolean;

  // Performance
  maxVideoBitrate: number;
  maxAudioBitrate: number;
  videoResolution: '480p' | '720p' | '1080p';

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableAnalytics: boolean;

  // Security
  tokenExpirySeconds: number;
  enableEncryption: boolean;
}

/**
 * Parse boolean from string environment variable
 */
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

/**
 * Parse integer from string environment variable
 */
const parseInteger = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Validate required environment variables
 */
const validateConfig = (config: AppConfig): void => {
  const errors: string[] = [];

  if (!config.agoraAppId) {
    errors.push('AGORA_APP_ID is required');
  }

  if (!config.apiBaseUrl) {
    errors.push('API_BASE_URL is required');
  }

  if (config.nodeEnv === 'production' && !config.agoraAppCertificate) {
    errors.push('AGORA_APP_CERTIFICATE is required in production');
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment configuration errors:\n${errors.join('\n')}\n\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};

/**
 * Load and validate environment configuration
 * This is called once at app startup
 */
const loadConfig = (): AppConfig => {
  const config: AppConfig = {
    // Agora Configuration
    agoraAppId: Config.AGORA_APP_ID || '',
    agoraAppCertificate: Config.AGORA_APP_CERTIFICATE || '',

    // Backend API
    apiBaseUrl: Config.API_BASE_URL || 'http://localhost:3000',
    apiTimeout: parseInteger(Config.API_TIMEOUT, 30000),

    // Environment
    nodeEnv: (Config.NODE_ENV as AppConfig['nodeEnv']) || 'development',

    // Feature Flags
    enableRecording: parseBoolean(Config.ENABLE_RECORDING, false),
    enableScreenShare: parseBoolean(Config.ENABLE_SCREEN_SHARE, false),
    enableChat: parseBoolean(Config.ENABLE_CHAT, true),
    enableWaitingRoom: parseBoolean(Config.ENABLE_WAITING_ROOM, true),

    // Performance
    maxVideoBitrate: parseInteger(Config.MAX_VIDEO_BITRATE, 1200),
    maxAudioBitrate: parseInteger(Config.MAX_AUDIO_BITRATE, 128),
    videoResolution: (Config.VIDEO_RESOLUTION as AppConfig['videoResolution']) || '720p',

    // Logging
    logLevel: (Config.LOG_LEVEL as AppConfig['logLevel']) || 'debug',
    enableAnalytics: parseBoolean(Config.ENABLE_ANALYTICS, false),

    // Security
    tokenExpirySeconds: parseInteger(Config.TOKEN_EXPIRY_SECONDS, 3600),
    enableEncryption: parseBoolean(Config.ENABLE_ENCRYPTION, true),
  };

  // Validate configuration
  validateConfig(config);

  return config;
};

/**
 * Cached configuration instance
 * Loaded once at app startup for performance
 */
let cachedConfig: AppConfig | null = null;

/**
 * Get application configuration
 * Returns cached instance after first load
 */
export const getConfig = (): AppConfig => {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
    
    // Log configuration in development (excluding sensitive data)
    if (cachedConfig.nodeEnv === 'development') {
      console.log('[Config] Application configuration loaded:', {
        environment: cachedConfig.nodeEnv,
        apiBaseUrl: cachedConfig.apiBaseUrl,
        features: {
          recording: cachedConfig.enableRecording,
          screenShare: cachedConfig.enableScreenShare,
          chat: cachedConfig.enableChat,
          waitingRoom: cachedConfig.enableWaitingRoom,
        },
        performance: {
          videoBitrate: cachedConfig.maxVideoBitrate,
          audioBitrate: cachedConfig.maxAudioBitrate,
          resolution: cachedConfig.videoResolution,
        },
      });
    }
  }

  return cachedConfig;
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return getConfig().nodeEnv === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return getConfig().nodeEnv === 'production';
};

/**
 * Get video resolution dimensions
 */
export const getVideoResolutionDimensions = (): { width: number; height: number } => {
  const resolution = getConfig().videoResolution;
  
  switch (resolution) {
    case '480p':
      return { width: 640, height: 480 };
    case '720p':
      return { width: 1280, height: 720 };
    case '1080p':
      return { width: 1920, height: 1080 };
    default:
      return { width: 1280, height: 720 };
  }
};

// Export singleton instance
export default getConfig();

// Made with Bob
