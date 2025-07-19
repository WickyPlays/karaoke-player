import { DirectoryManager } from "./directory_manager";
import { SettingsManager } from "./settings_manager";

export class AudioManager {
  private static _instance: AudioManager;
  private homeAudio: HTMLAudioElement | null = null;
  private waitingAudio: HTMLAudioElement | null = null;

  static instance(): AudioManager {
    if (!AudioManager._instance) {
      AudioManager._instance = new AudioManager();
    }
    return AudioManager._instance;
  }

  public async playHomeMusic() {
    this.stopHomeMusic();
    const enabled: boolean = SettingsManager.instance().getSettingsHomeMusic();
    if (!enabled) {
      return;
    }

    const fileURL: string = await DirectoryManager.instance().getTitleFile();
    const volume: number =
      SettingsManager.instance().getSettingsHomeMusicVolume();
    this.homeAudio = new Audio(fileURL);
    this.homeAudio.volume = volume;
    this.homeAudio.loop = true;
    await this.homeAudio.play();
  }

  public stopHomeMusic() {
    if (this.homeAudio) {
      this.homeAudio.pause();
      this.homeAudio = null;
    }
  }

  public async playWaitingMusic() {
    this.stopWaitingMusic();
    const enabled: boolean =
      SettingsManager.instance().getSettingsWaitingMusic();
    if (!enabled) {
      return;
    }

    const fileURL: string =
      await DirectoryManager.instance().getWaitingMusicFile();
    const volume: number =
      SettingsManager.instance().getSettingsWaitingMusicVolume();

    this.waitingAudio = new Audio(fileURL);
    this.waitingAudio.volume = volume;
    this.waitingAudio.loop = true;
    await this.waitingAudio.play();
  }

  public stopWaitingMusic() {
    if (this.waitingAudio) {
      this.waitingAudio.pause();
      this.waitingAudio = null;
    }
  }

  public stopAllMusic() {
    this.stopHomeMusic();
    this.stopWaitingMusic();
  }
}
