import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from './config';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private prefix = 'dtris_cache_';

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const expiresAt = Date.now() + (ttl || config.performance.cacheTimeout);
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
    };

    try {
      await AsyncStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.prefix}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > cacheItem.expiresAt) {
        await this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.warn('Cache delete failed:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key => 
        key.startsWith(this.prefix) && key.includes(pattern)
      );
      await AsyncStorage.multiRemove(matchingKeys);
    } catch (error) {
      console.warn('Cache invalidate pattern failed:', error);
    }
  }
}

export const cacheManager = new CacheManager();