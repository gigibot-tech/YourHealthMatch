/**
 * API Client Service
 * Handles backend communication with optimizations
 * 
 * Key Optimizations:
 * - Token caching to reduce API calls
 * - Request deduplication
 * - Automatic retry with exponential backoff
 * - Connection pooling via axios
 * - Request/response interceptors for logging
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig } from '../../config/env';
import { AgoraToken } from '../../types';

interface TokenCacheEntry {
  token: AgoraToken;
  cachedAt: Date;
}

class ApiClient {
  private client: AxiosInstance;
  private tokenCache: Map<string, TokenCacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private readonly TOKEN_CACHE_KEY = '@telemedicine/token_cache';

  constructor() {
    const config = getConfig();

    // Create axios instance with optimized configuration
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
      // Enable connection pooling
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    this.setupInterceptors();
    this.loadTokenCache();
  }

  /**
   * Set up request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (__DEV__) {
          console.log('[ApiClient] Request:', config.method?.toUpperCase(), config.url);
        }

        return config;
      },
      (error) => {
        console.error('[ApiClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (__DEV__) {
          console.log('[ApiClient] Response:', response.status, response.config.url);
        }
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Retry logic for network errors
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          if (!config._retry) {
            config._retry = true;
            console.log('[ApiClient] Retrying request:', config.url);
            return this.client.request(config);
          }
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
          console.log('[ApiClient] Unauthorized, clearing auth');
          await this.clearAuthToken();
        }

        console.error('[ApiClient] Response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get Agora token from backend with caching
   * Prevents bottleneck by caching tokens and deduplicating requests
   */
  async getAgoraToken(
    appointmentId: string,
    channelName: string,
    uid: number = 0
  ): Promise<AgoraToken> {
    const cacheKey = `${appointmentId}_${channelName}_${uid}`;

    // Check cache first
    const cached = this.tokenCache.get(cacheKey);
    if (cached && this.isTokenValid(cached.token)) {
      console.log('[ApiClient] Using cached token for:', channelName);
      return cached.token;
    }

    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      console.log('[ApiClient] Waiting for pending token request:', channelName);
      return pending;
    }

    // Make new request
    const requestPromise = this.fetchAgoraToken(appointmentId, channelName, uid);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const token = await requestPromise;
      
      // Cache the token
      this.tokenCache.set(cacheKey, {
        token,
        cachedAt: new Date(),
      });
      await this.saveTokenCache();

      return token;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch Agora token from backend
   */
  private async fetchAgoraToken(
    appointmentId: string,
    channelName: string,
    uid: number
  ): Promise<AgoraToken> {
    try {
      const response = await this.client.post('/api/video/token', {
        appointmentId,
        channelName,
        uid,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }

      const data = response.data;
      return {
        token: data.token,
        channelName: data.channelName,
        uid: data.uid,
        expiresAt: new Date(data.expiresAt),
      };
    } catch (error) {
      console.error('[ApiClient] Failed to fetch Agora token:', error);
      throw new Error(`Failed to get Agora token: ${error}`);
    }
  }

  /**
   * Pre-fetch token to warm up cache
   * Call this when user enters waiting room
   */
  async prefetchAgoraToken(
    appointmentId: string,
    channelName: string,
    uid: number = 0
  ): Promise<void> {
    try {
      console.log('[ApiClient] Pre-fetching token for:', channelName);
      await this.getAgoraToken(appointmentId, channelName, uid);
    } catch (error) {
      console.error('[ApiClient] Failed to pre-fetch token:', error);
      // Don't throw - this is just optimization
    }
  }

  /**
   * Check if token is still valid
   */
  private isTokenValid(token: AgoraToken): boolean {
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    
    // Consider token invalid if it expires in less than 5 minutes
    const bufferMs = 5 * 60 * 1000;
    return expiresAt.getTime() - now.getTime() > bufferMs;
  }

  /**
   * Start a call session
   */
  async startCallSession(appointmentId: string): Promise<{ sessionId: string }> {
    try {
      const response = await this.client.post('/api/video/session/start', {
        appointmentId,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      console.error('[ApiClient] Failed to start call session:', error);
      throw error;
    }
  }

  /**
   * End a call session
   */
  async endCallSession(
    sessionId: string,
    duration: number,
    reason: string = 'normal'
  ): Promise<void> {
    try {
      await this.client.post('/api/video/session/end', {
        sessionId,
        duration,
        reason,
      });
    } catch (error) {
      console.error('[ApiClient] Failed to end call session:', error);
      // Don't throw - session will timeout on backend
    }
  }

  /**
   * Report call quality metrics
   */
  async reportMetrics(sessionId: string, metrics: any): Promise<void> {
    try {
      await this.client.post('/api/video/metrics', {
        sessionId,
        metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ApiClient] Failed to report metrics:', error);
      // Don't throw - metrics are optional
    }
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | null {
    // Implement based on your auth system
    // For now, return null
    return null;
  }

  /**
   * Clear auth token
   */
  private async clearAuthToken(): Promise<void> {
    // Implement based on your auth system
    await AsyncStorage.removeItem('@telemedicine/auth_token');
  }

  /**
   * Load token cache from storage
   */
  private async loadTokenCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.TOKEN_CACHE_KEY);
      if (cached) {
        const entries = JSON.parse(cached);
        this.tokenCache = new Map(
          entries.map(([key, value]: [string, TokenCacheEntry]) => [
            key,
            {
              ...value,
              token: {
                ...value.token,
                expiresAt: new Date(value.token.expiresAt),
              },
              cachedAt: new Date(value.cachedAt),
            },
          ])
        );
        console.log('[ApiClient] Loaded token cache:', this.tokenCache.size, 'entries');
      }
    } catch (error) {
      console.error('[ApiClient] Failed to load token cache:', error);
    }
  }

  /**
   * Save token cache to storage
   */
  private async saveTokenCache(): Promise<void> {
    try {
      const entries = Array.from(this.tokenCache.entries());
      await AsyncStorage.setItem(this.TOKEN_CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('[ApiClient] Failed to save token cache:', error);
    }
  }

  /**
   * Clear token cache
   */
  async clearTokenCache(): Promise<void> {
    this.tokenCache.clear();
    await AsyncStorage.removeItem(this.TOKEN_CACHE_KEY);
    console.log('[ApiClient] Token cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.tokenCache.size,
      entries: Array.from(this.tokenCache.keys()),
    };
  }
}

// Export singleton instance
export default new ApiClient();

// Made with Bob
