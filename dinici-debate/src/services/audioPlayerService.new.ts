import { audioCache } from './audioCacheService';

export interface AudioPlayerEvent {
  type: 'start' | 'end' | 'error' | 'pause' | 'resume' | 'progress';
  messageId: string;
  error?: Error;
  state?: AudioPlayerState;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  messageId: string | null;
}

export interface AudioPlayerEvent {
  type: 'start' | 'end' | 'error' | 'pause' | 'resume' | 'progress';
  messageId: string;
  error?: Error;
  state?: AudioPlayerState;
}

export interface AudioPlayerService {
  playAudio(messageId: string, role: string): Promise<void>;
  pauseAudio(): void;
  resumeAudio(): void;
  stopCurrentAudio(): void;
  clearQueue(): void;
  getCurrentState(): AudioPlayerState;
  addEventListener(callback: (event: AudioPlayerEvent) => void): void;
  removeEventListener(callback: (event: AudioPlayerEvent) => void): void;
}

interface QueueItem {
  messageId: string;
  role: string;
  audio: HTMLAudioElement;
  retryCount: number;
}

class AudioPlayerServiceImpl implements AudioPlayerService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentMessageId: string | null = null;
  private _isPlaying = false;
  private _isPaused = false;
  private eventListeners: Set<(event: AudioPlayerEvent) => void> = new Set();
  private audioQueue: QueueItem[] = [];
  private isProcessingQueue = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 重试间隔1秒
  private progressInterval: number | null = null;

  public getCurrentState(): AudioPlayerState {
    if (!this.currentAudio) {
      return {
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        messageId: null
      };
    }

    return {
      isPlaying: this._isPlaying,
      isPaused: this._isPaused,
      currentTime: this.currentAudio.currentTime,
      duration: this.currentAudio.duration || 0,
      messageId: this.currentMessageId
    };
  }

  public pauseAudio(): void {
    if (this.currentAudio && this._isPlaying && !this._isPaused) {
      this.currentAudio.pause();
      this._isPaused = true;
      this._isPlaying = false;
      this.notifyListeners({
        type: 'pause',
        messageId: this.currentMessageId!,
        state: this.getCurrentState()
      });
      console.log('音频已暂停:', this.currentMessageId);
    }
  }

  public resumeAudio(): void {
    if (this.currentAudio && this._isPaused) {
      this.currentAudio.play().then(() => {
        this._isPaused = false;
        this._isPlaying = true;
        this.notifyListeners({
          type: 'resume',
          messageId: this.currentMessageId!,
          state: this.getCurrentState()
        });
        console.log('音频继续播放:', this.currentMessageId);
      }).catch(error => {
        console.error('恢复播放失败:', error);
      });
    }
  }

  /**
   * 播放音频
   */
  private startProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    
    this.progressInterval = window.setInterval(() => {
      if (this.currentAudio && this.currentMessageId) {
        this.notifyListeners({
          type: 'progress',
          messageId: this.currentMessageId,
          state: this.getCurrentState()
        });
      }
    }, 250) as unknown as number;
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private async playAudioItem(item: QueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const { audio, messageId } = item;

      const onPlay = () => {
        this._isPlaying = true;
        this._isPaused = false;
        this.currentMessageId = messageId;
        this.startProgressTracking();
        this.notifyListeners({ 
          type: 'start', 
          messageId,
          state: this.getCurrentState()
        });
        console.log('音频开始播放:', messageId);
      };

      const onEnded = () => {
        this._isPlaying = false;
        this._isPaused = false;
        this.currentAudio = null;
        this.currentMessageId = null;
        this.stopProgressTracking();
        this.notifyListeners({ 
          type: 'end', 
          messageId,
          state: this.getCurrentState()
        });
        console.log('音频播放结束:', messageId);
        resolve();
      };

      const onError = (error: Event) => {
        this._isPlaying = false;
        this._isPaused = false;
        this.currentAudio = null;
        this.currentMessageId = null;
        this.stopProgressTracking();
        console.error('音频播放错误:', error);
        reject(new Error('音频播放失败'));
      };

      // 设置事件监听器
      audio.addEventListener('play', onPlay);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      // 开始播放
      this.stopCurrentAudio();
      this.currentAudio = audio;
      audio.play().catch(reject);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.audioQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    try {
      while (this.audioQueue.length > 0) {
        const item = this.audioQueue[0];
        try {
          await this.playAudioItem(item);
          this.audioQueue.shift(); // 播放成功后移除
        } catch (error) {
          if (item.retryCount < this.MAX_RETRIES) {
            item.retryCount++;
            console.log(`重试播放音频 ${item.messageId}，第 ${item.retryCount} 次`);
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          } else {
            console.error(`音频 ${item.messageId} 播放失败，已达最大重试次数`);
            this.audioQueue.shift(); // 达到最大重试次数后移除
            this.notifyListeners({
              type: 'error',
              messageId: item.messageId,
              error: error instanceof Error ? error : new Error('播放失败')
            });
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  async playAudio(messageId: string, role: string): Promise<void> {
    try {
      // 获取音频数据
      const audioBase64 = audioCache.get(messageId, role);
      if (!audioBase64) {
        throw new Error('音频数据不存在');
      }

      // 创建音频对象
      const audio = new Audio();
      audio.src = `data:audio/mp3;base64,${audioBase64}`;
      
      // 预加载音频
      await new Promise((resolve, reject) => {
        audio.preload = 'auto';
        audio.oncanplaythrough = resolve;
        audio.onerror = reject;
      });

      // 将音频添加到队列
      this.audioQueue.push({
        messageId,
        role,
        audio,
        retryCount: 0
      });

      // 开始处理队列
      this.processQueue();
      
      // 设置音频事件
      audio.addEventListener('loadstart', () => {
        console.log('音频开始加载:', messageId);
      });
      
      audio.addEventListener('canplay', () => {
        console.log('音频可以播放:', messageId);
      });
      
      audio.addEventListener('play', () => {
        this._isPlaying = true;
        this.currentMessageId = messageId;
        this.notifyListeners({ type: 'start', messageId });
        console.log('音频开始播放:', messageId);
      });
      
      audio.addEventListener('ended', () => {
        this._isPlaying = false;
        this.currentAudio = null;
        this.notifyListeners({ type: 'end', messageId });
        console.log('音频播放结束:', messageId);
      });
      
      audio.addEventListener('error', (error) => {
        this._isPlaying = false;
        this.currentAudio = null;
        this.notifyListeners({ 
          type: 'error', 
          messageId,
          error: new Error('音频播放错误')
        });
        console.error('音频播放错误:', error);
      });

      // 播放音频
      this.currentAudio = audio;
      await audio.play();
      
    } catch (error) {
      this.notifyListeners({ 
        type: 'error',
        messageId,
        error: error instanceof Error ? error : new Error('未知错误')
      });
      console.error('播放音频失败:', error);
      throw error;
    }
  }

  /**
   * 停止当前播放的音频
   */
  stopCurrentAudio(): void {
    if (this.currentAudio && this.currentMessageId) {
      const messageId = this.currentMessageId;
      
      // 移除所有事件监听器
      const clone = this.currentAudio.cloneNode() as HTMLAudioElement;
      this.currentAudio.replaceWith(clone);
      
      // 停止播放
      clone.pause();
      clone.currentTime = 0;
      
      // 清理状态
      this.currentAudio = null;
      this.currentMessageId = null;
      this._isPlaying = false;
      this.notifyListeners({ type: 'end', messageId });
      console.log('音频播放已停止:', messageId);
    }
  }

  /**
   * 清空播放队列
   */
  clearQueue(): void {
    this.audioQueue = [];
    this.stopCurrentAudio();
    console.log('已清空播放队列');
  }

  // 移除了自动播放相关方法

  addEventListener(callback: (event: AudioPlayerEvent) => void): void {
    this.eventListeners.add(callback);
  }

  removeEventListener(callback: (event: AudioPlayerEvent) => void): void {
    this.eventListeners.delete(callback);
  }

  private notifyListeners(event: AudioPlayerEvent): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}

// 导出单例实例
export const audioPlayer = new AudioPlayerServiceImpl();
