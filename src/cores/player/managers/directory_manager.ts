import { Directory } from "@capacitor/filesystem";
import { Filesystem } from "@capacitor/filesystem";
import {
  isPlatformDesktop,
  isPlatformPhone,
} from "src/cores/utils/util_platform";

export class DirectoryManager {
  private static _instance: DirectoryManager;

  static instance(): DirectoryManager {
    if (!DirectoryManager._instance) {
      DirectoryManager._instance = new DirectoryManager();
    }
    return DirectoryManager._instance;
  }

  private async getCorrectPath(path: string): Promise<string> {
    if (isPlatformPhone()) {
      return path;
    } else if (isPlatformDesktop()) {
      const parentFolder = await window.electronAPI.getAppPath();
      return path ? `${parentFolder}\\${path}` : parentFolder;
    }
    return path;
  }

  public async getTitleFile() {
    let destinationPath: string = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    try {
      const title = await window.electronAPI.readFile(await this.getCorrectPath("se\\title.mp3"));
      if (title) {
        const uriResult = await window.electronAPI.getFileURL(title.path);
        destinationPath = uriResult.url
      }
    } catch (error) {
      console.error("Error getting title file:", error);
    }

    return destinationPath;
  }

  public async getWaitingMusicFile() {
    let destinationPath: string = "";

    try {
      const waitingMusic = await window.electronAPI.readFile(await this.getCorrectPath("se\\waiting.mp3"));
      if (waitingMusic) {
        const uriResult = await window.electronAPI.getFileURL(waitingMusic.path);
        destinationPath = uriResult.url
      }
    } catch (error) {
      console.error("Error getting waiting music file:", error);
    }

    return destinationPath;
  }

  public async createMissingFolders() {
    if (isPlatformPhone()) {
      await Filesystem.requestPermissions().catch(() => {});
      await Promise.all(
        ["backgrounds", "songs", "se"].map((path) =>
          Filesystem.mkdir({
            path,
            directory: Directory.External,
            recursive: true,
          }).catch(console.error)
        )
      );
    } else if (isPlatformDesktop()) {
      const parentFolder = await window.electronAPI.getAppPath();
      await Promise.all(
        ["backgrounds", "songs", "se"].map((path) =>
          window.electronAPI.createFolder(parentFolder + "/" + path)
        )
      );
    }
  }
}
