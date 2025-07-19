import { Store } from "src/cores/store";

export class SettingsManager {

  private static _instance: SettingsManager;

  public static instance(): SettingsManager {
    if (!SettingsManager._instance) {
      SettingsManager._instance = new SettingsManager();
    }
    return SettingsManager._instance;
  }

  private setSetting(key: string, value: string | number | boolean) {
    Store.setStore(key, value);
  }

  private getSetting(key: string): string | number | boolean | null {
    return Store.getStore(key);
  }

  public getSettingsHomeMusic(): boolean {
    return this.getSetting("settings.general.homeMusic") as boolean || false;
  }

  public setSettingsHomeMusic(value: boolean) {
    this.setSetting("settings.general.homeMusic", value);
  }

  public setSettingsHomeMusicVolume(value: number) {
    this.setSetting("settings.general.homeMusicVolume", value || 1);
  }

  public getSettingsHomeMusicVolume(): number {
    return this.getSetting("settings.general.homeMusicVolume") as number || 1;
  }

  public getSettingsWaitingMusic(): boolean {
    return this.getSetting("settings.general.waitingMusic") as boolean || false;
  }

  public setSettingsWaitingMusic(value: boolean) {
    this.setSetting("settings.general.waitingMusic", value);
  }

  public setSettingsWaitingMusicVolume(value: number) {
    this.setSetting("settings.general.waitingMusicVolume", value || 1);
  }

  public getSettingsWaitingMusicVolume(): number {
    return this.getSetting("settings.general.waitingMusicVolume") as number || 1;
  }
}
