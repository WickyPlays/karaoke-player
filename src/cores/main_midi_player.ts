import {
  BaseDirectory,
  readDir,
  readFile,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import { Song } from "./songs";

export class MainMidiPlayer {
  private static instance: MainMidiPlayer;
  public songs: Song[];

  private constructor() {
    this.songs = [];
  }

  public async loadAllSongs() {
    this.songs = [];

    const dirEntries = await readDir("songs", {
      baseDir: BaseDirectory.Resource,
    });
    const songPromises = dirEntries
      .filter((entry) => entry.isDirectory)
      .map((entry) => {
        const configFile = "songs/" + entry.name + "/config.json";
        return readTextFile(configFile, {
          baseDir: BaseDirectory.Resource,
        }).then((content) => {
          const jsonContent = JSON.parse(content);
          return new Song(
            jsonContent.number,
            jsonContent.title,
            jsonContent.artist,
            entry.name
          );
        });
      });
    const songs = await Promise.all(songPromises);
    songs.forEach((song) => this.addSong(song));

    console.log(`Song has been loaded. There are ${this.songs.length} songs.`);
  }

  public addSong(song: Song) {
    this.songs.push(song);
  }

  public getSongByNumber(number: string): Song | undefined {
    return this.songs.find((song) => song.number === number);
  }

  public static getInstance(): MainMidiPlayer {
    if (!MainMidiPlayer.instance) {
      MainMidiPlayer.instance = new MainMidiPlayer();
    }
    return MainMidiPlayer.instance;
  }
}
