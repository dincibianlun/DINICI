/**
 * 音频播放服务
 * 处理base64音频数据的播放和管理
 */

import { audioCache } from './audioCacheService';

class AudioPlayerService {
  private currentAudio: HTMLAudioElement | null = null;
  private _isPlaying = false;
  private _autoPlayEnabled = true; // 自动播放开关
  private playQueue: Array<{ content: string; role: string }> = []; // 播放队列
  private isProcessingQueue = false; // 队列处理状态

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get autoPlayEnabled(): boolean {
    return this._autoPlayEnabled;
  }

  public set autoPlayEnabled(value: boolean) {
    this._autoPlayEnabled = value;
  }

  /**
   * 播放音频
   * @param content 文本内容
   * @param role 发言角色
   */
  async playAudio(content: string, role: string): Promise<void> {
    try {
      // 停止当前播放的音频
      this.stopCurrentAudio();

      // 从缓存获取音频数据
      const audioData = audioCache.get(content, role);
      if (!audioData) {
        throw new Error('音频数据不存在');
      }

      // 创建音频对象
      const audio = new Audio();
      audio.src = `data:audio/mp3;base64,${audioData}`;
      
      // 设置音频事件
      audio.onloadstart = () => {
        console.log('音频开始加载');
      };
      
      audio.oncanplay = () => {
        console.log('音频可以播放');
      };
      
      audio.onplay = () => {
        this._isPlaying = true;
        console.log('音频开始播放');
      };
      
      audio.onended = () => {
        this._isPlaying = false;
        this.currentAudio = null;
        console.log('音频播放结束');
      };
      
      audio.onerror = (error) => {
        this._isPlaying = false;
        this.currentAudio = null;
        console.error('音频播放错误:', error);
      };

      // 播放音频
      this.currentAudio = audio;
      await audio.play();
      
    } catch (error) {
      console.error('播放音频失败:', error);
      throw error;
    }
  }

  /**
   * 停止当前播放的音频
   */
  stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this._isPlaying = false;
      console.log('音频播放已停止');
    }
  }

  /**
   * 暂停当前播放的音频
   */
  pauseCurrentAudio(): void {
    if (this.currentAudio && this._isPlaying) {
      this.currentAudio.pause();
      this._isPlaying = false;
      console.log('音频播放已暂停');
    }
  }

  /**
   * 恢复播放
   */
  resumeCurrentAudio(): void {
    if (this.currentAudio && !this._isPlaying) {
      this.currentAudio.play();
      this._isPlaying = true;
      console.log('音频播放已恢复');
    }
  }

  /**
   * 获取播放状态
   */
  getPlayingStatus(): {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  } {
    if (!this.currentAudio) {
      return {
        isPlaying: false,
        currentTime: 0,
        duration: 0
      };
    }

    return {
      isPlaying: this._isPlaying,
      currentTime: this.currentAudio.currentTime,
      duration: this.currentAudio.duration || 0
    };
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 设置自动播放开关
   */
  setAutoPlay(enabled: boolean): void {
    this._autoPlayEnabled = enabled;
    console.log(`自动播放已${enabled ? '开启' : '关闭'}`);
  }

  /**
   * 获取自动播放状态
   */
  getAutoPlayStatus(): boolean {
    return this.autoPlayEnabled;
  }

  /**
   * 自动播放音频（在音频生成完成后调用）
   */
  autoPlayAudio(content: string, role: string): void {
    if (!this.autoPlayEnabled) {
      console.log('自动播放已关闭，跳过播放');
      return;
    }

    // 添加到播放队列
    this.playQueue.push({ content, role });
    console.log(`音频已加入播放队列: ${role} - ${content.substring(0, 50)}...`);

    // 开始处理队列
    this.processPlayQueue();
  }

  /**
   * 处理播放队列
   */
  private async processPlayQueue(): Promise<void> {
    if (this.isProcessingQueue || this.playQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.playQueue.length > 0) {
      const { content, role } = this.playQueue.shift()!;
      
      try {
        console.log(`正在自动播放: ${role} - ${content.substring(0, 50)}...`);
        await this.playAudio(content, role);
        
        // 等待当前音频播放完成
        await this.waitForCurrentAudioToEnd();
        
      } catch (error) {
        console.error('自动播放失败:', error);
        // 继续播放下一个
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * 等待当前音频播放完成
   */
  private waitForCurrentAudioToEnd(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentAudio || !this._isPlaying) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (!this._isPlaying || !this.currentAudio) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // 超时保护（最多等待30秒）
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 30000);
    });
  }

  /**
   * 检查音频是否可用
   */
  isAudioAvailable(content: string, role: string): boolean {
    return audioCache.has(content, role);
  }
}

// 导出单例实例
export const audioPlayer = new AudioPlayerService();