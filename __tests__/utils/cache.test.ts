import { cacheManager } from '@/utils/cache';

// Mock AsyncStorage
const mockAsyncStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('CacheManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('set', () => {
    it('should store data with expiration', async () => {
      const testData = { name: 'Test', value: 123 };
      const key = 'test-key';
      
      await cacheManager.set(key, testData, 60000); // 1 minute TTL
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'dtris_cache_test-key',
        expect.stringContaining('"data":{"name":"Test","value":123}')
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));
      
      // Should not throw
      await expect(cacheManager.set('key', 'data')).resolves.toBeUndefined();
    });
  });

  describe('get', () => {
    it('should retrieve valid cached data', async () => {
      const testData = { name: 'Test', value: 123 };
      const cacheItem = {
        data: testData,
        timestamp: Date.now(),
        expiresAt: Date.now() + 60000, // 1 minute from now
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheItem));
      
      const result = await cacheManager.get('test-key');
      
      expect(result).toEqual(testData);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('dtris_cache_test-key');
    });

    it('should return null for expired data', async () => {
      const testData = { name: 'Test', value: 123 };
      const cacheItem = {
        data: testData,
        timestamp: Date.now() - 120000, // 2 minutes ago
        expiresAt: Date.now() - 60000, // Expired 1 minute ago
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cacheItem));
      
      const result = await cacheManager.get('test-key');
      
      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('dtris_cache_test-key');
    });

    it('should return null for non-existent data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      
      const result = await cacheManager.get('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should handle corrupted cache data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid-json');
      
      const result = await cacheManager.get('corrupted-key');
      
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove cached item', async () => {
      await cacheManager.delete('test-key');
      
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('dtris_cache_test-key');
    });

    it('should handle deletion errors gracefully', async () => {
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Delete failed'));
      
      await expect(cacheManager.delete('key')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove all cache items', async () => {
      const allKeys = [
        'dtris_cache_key1',
        'dtris_cache_key2',
        'other_key',
        'dtris_cache_key3',
      ];
      
      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys);
      
      await cacheManager.clear();
      
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'dtris_cache_key1',
        'dtris_cache_key2',
        'dtris_cache_key3',
      ]);
    });
  });

  describe('invalidatePattern', () => {
    it('should remove items matching pattern', async () => {
      const allKeys = [
        'dtris_cache_users_1',
        'dtris_cache_users_2',
        'dtris_cache_vehicles_1',
        'other_key',
      ];
      
      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys);
      
      await cacheManager.invalidatePattern('users');
      
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'dtris_cache_users_1',
        'dtris_cache_users_2',
      ]);
    });
  });
});