/**
 * 音频缓存服务
 * 用于管理TTS生成的音频，避免重复生成相同内容的语音
 */

export interface AudioCacheItem {
  audioData: string; // base64音频数据
  timestamp: number; // 缓存时间
  role: string; // 角色
}

class AudioCacheService {
  private cache = new Map<string, AudioCacheItem>();
  private maxSize = 50; // 最多缓存50个音频
  private maxAge = 30 * 60 * 1000; // 30分钟过期

  /**
   * 生成缓存键
   */
  generateKey(content: string, role: string): string {
    // 使用内容和角色生成唯一键
    const combinedText = `${role}:${content}`;
    return btoa(encodeURIComponent(combinedText)).substring(0, 32);
  }

  /**
   * 设置缓存
   */
  set(content: string, role: string, audioData: string): void {
    const key = this.generateKey(content, role);
    
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      this.cleanOldest();
    }

    this.cache.set(key, {
      audioData,
      timestamp: Date.now(),
      role
    });

    console.log(`音频缓存已保存: ${key} (${role})`);
  }

  /**
   * 获取缓存
   */
  get(content: string, role: string): string | null {
    const key = this.generateKey(content, role);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      console.log(`音频缓存已过期: ${key}`);
      return null;
    }

    console.log(`音频缓存命中: ${key} (${role})`);
    return item.audioData;
  }

  /**
   * 检查缓存是否存在
   */
  has(content: string, role: string): boolean {
    return this.get(content, role) !== null;
  }

  /**
   * 清理最旧的缓存项
   */
  private cleanOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`清理最旧缓存: ${oldestKey}`);
    }
  }

  /**
   * 清理所有过期缓存
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.maxAge) {
        this.cache.delete(key);
        console.log(`清理过期缓存: ${key}`);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    console.log('所有音频缓存已清空');
  }

  /**
   * 获取缓存状态
   */
  getStatus(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出单例实例
export const audioCache = new AudioCacheService();

// 定期清理过期缓存
setInterval(() => {
  audioCache.cleanExpired();
}, 5 * 60 * 1000); // 每5分钟清理一次