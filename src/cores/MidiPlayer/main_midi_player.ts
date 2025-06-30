import {
  BaseDirectory,
  readDir,
  readFile,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import { Song } from "../songs";
import globalEvent from "../global_event";
import sf3 from '../../assets/SGM.sf3';
import worklet_processor from '../../assets/worklet_processor.min.js';
import { Synthetizer } from "spessasynth_lib"

export class MainMidiPlayer {
  private static instance: MainMidiPlayer;
  public songs: Song[];
  public queueSongs: Song[] = [];

  private constructor() {
    this.songs = [];
    
    this.loadSynth();
  }

  public async loadSynth() {
    const sfont = await (await fetch(sf3)).arrayBuffer();
    const ctx = new AudioContext();
    await ctx.audioWorklet.addModule(worklet_processor);
    const synth = new Synthetizer(ctx.destination, sfont);
    synth.noteOn(0, 52, 127);
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
    songs.forEach((song) => this.songs.push(song));

    console.log(`Song has been loaded. There are ${this.songs.length} songs.`);
  }

  public addSongToQueue(song: Song) {
    this.queueSongs.push(song);
    globalEvent.call("song_queue_added", { song, queueSongs: this.queueSongs, length: this.queueSongs.length });
  }

  public getSongByNumber(number: string): Song | undefined {
    return this.songs.find((song) => song.number == number);
  }

  public addSongByNumber(number: string) {
    const song = this.getSongByNumber(number);
    if (song) {
      this.addSongToQueue(song);
      console.log(`There are ${this.queueSongs.length} songs in queue.`);
    }
  }

  public clearQueue() {
    this.queueSongs = [];
    globalEvent.call("song_queue_clear");
  }

  public static getInstance(): MainMidiPlayer {
    if (!MainMidiPlayer.instance) {
      MainMidiPlayer.instance = new MainMidiPlayer();
    }
    return MainMidiPlayer.instance;
  }
}
