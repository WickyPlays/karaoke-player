import { Directory, Filesystem, Encoding } from "@capacitor/filesystem";
import { Song, SongType } from "./obj/song";
import { IKaraokePlayerProcessor } from "./obj/interfaces";
import { Synthetizer } from "spessasynth_lib";
import globalEvent from "../global_events";
import { KaraokePlayerMidiProcessor } from "./processors/midiProcessor";
import { KaraokePlayerAudioProcessor } from "./processors/audioProcessor";
import { Buffer } from "buffer";
import { isPlatformPhone, isPlatformDesktop } from "../utils/util_platform";
import { DirectoryManager } from "./managers/directory_manager";
import { AudioManager } from "./managers/audio_manager";

export class Player {
  private static _instance: Player;
  public songs: Song[];
  public queueSongs: Song[];
  public playingSong: Song | null = null;
  private audioContext: AudioContext | null = null;
  private synth: Synthetizer | null = null;
  private currentProcessor: IKaraokePlayerProcessor | null = null;
  private lyricFrames = [];
  private totalSongs = 0;

  private constructor() {
    this.songs = [];
    this.queueSongs = [];
    globalEvent.on("player_song_stopped", () => this.playSongInQueue());
  }

  public static instance(): Player {
    return this._instance || (this._instance = new Player());
  }

  public async setup(): Promise<void> {
    console.log("Setting up...");
    globalEvent.call("player_load_start");
    await DirectoryManager.instance().createMissingFolders();
    await this.loadSynth();
    await this.loadAllSongs();
    globalEvent.call("player_load_end");
    await AudioManager.instance().playWaitingMusic();
  }

  public async loadAllSongs() {
    try {
      const parentFolder = await window.electronAPI.getAppPath();
      const songFolders = isPlatformPhone()
        ? (
            await Filesystem.readdir({
              path: "songs",
              directory: Directory.External,
            })
          ).files
        : await window.electronAPI.openDirectory(parentFolder + "/songs");

      this.totalSongs = songFolders.length;

      for (let songFolder of songFolders) {
        const path = isPlatformPhone()
          ? `songs/${songFolder.name}/config.json`
          : `${songFolder.path}\\config.json`;

        const songFile = isPlatformPhone()
          ? await Filesystem.readFile({
              path,
              directory: Directory.External,
              encoding: Encoding.UTF8,
            })
          : await window.electronAPI.readTextFile(path);

        if (songFile) {
          const songJson = JSON.parse(
            isPlatformPhone() ? (songFile.data as string) : songFile.content
          );
          const song = new Song();
          song.setNumber(songJson.number);
          song.setParentFolder(
            isPlatformPhone() ? `songs/${songFolder.name}` : songFolder.path
          );
          song.setTitle(songJson.title);
          song.setTitleTranslit(songJson.title_translit);
          song.setArtist(songJson.artist);
          song.setSongPath(songJson?.song_path);
          song.setLyricPath(songJson?.lyric_path);
          song.setBgPath(songJson?.bg_path);
          song.setJudgementPath(songJson?.judgement_path);
          song.setSongType(
            songJson?.song_path?.endsWith(".mid") ||
              songJson?.song_path?.endsWith(".kar")
              ? SongType.MIDI
              : SongType.AUDIO
          );
          this.loadSong(song);
        }
      }
    } catch (error) {
      console.error("Error loading songs:", error);
    }
  }

  public loadSong(song: Song) {
    this.songs.push(song);
    globalEvent.call("player_load_update", {
      song,
      title: "Loading songs ",
      subtitle: song.getTitle(),
      footer: `(${this.songs.length}/${this.totalSongs})`,
    });
  }

  public async loadSynth() {
    try {
      const sfont = await (await fetch("SGM.sf3")).arrayBuffer();
      this.audioContext = new AudioContext();
      await this.audioContext.audioWorklet.addModule(
        "worklet_processor.min.js"
      );
      this.synth = new Synthetizer(this.audioContext.destination, sfont);
    } catch (error) {
      console.error("Error loading synthesizer:", error);
    }
  }

  public getLoadedSongs() {
    return this.songs;
  }

  public addSongToQueue(song: Song, playIfEmpty: boolean = false) {
    this.queueSongs.push(song);
    globalEvent.call("song_queue_added", {
      song,
      queueSongs: this.queueSongs,
      length: this.queueSongs.length,
    });
    if (playIfEmpty && !this.playingSong && this.queueSongs.length === 1)
      this.playSongInQueue();
  }

  public getSongByNumber(number: string): Song | undefined {
    return this.songs.find((song) => song.getNumber() == number);
  }

  public addSongByNumber(number: string) {
    const song = this.getSongByNumber(number);
    if (song) this.addSongToQueue(song, true);
  }

  public async playSong(song: Song) {
    if (!song) {
      return;
    }

    AudioManager.instance().stopWaitingMusic();
    try {
      this.playingSong = song;
      const songPath: string = `${song.getParentFolder()}/${song.getSongPath()}`;

      const songBuffer = isPlatformPhone()
        ? Buffer.from(
            String(
              (
                await Filesystem.readFile({
                  path: songPath,
                  directory: Directory.External,
                })
              ).data
            ),
            "base64"
          )
        : (await window.electronAPI.readFile(songPath)).buffer;

      this.playingSong.setFileBuffer(songBuffer);
      this.currentProcessor =
        song.getSongType() === SongType.MIDI
          ? new KaraokePlayerMidiProcessor()
          : new KaraokePlayerAudioProcessor();

      await this.currentProcessor?.processSong(song);
      this.currentProcessor?.start();
      globalEvent.call("song_played", { song, queueSongs: this.queueSongs });
    } catch (error) {
      console.error("Error playing song:", error);
    }
  }

  public async getCurrentVideoBackground() {
    try {
      const song: Song | null = this.playingSong;
      if (song) {
        const bg = await window.electronAPI.readFile(
          song.getParentFolder() + "\\" + song.getBgPath()
        );
        if (bg) {
          const uri = await window.electronAPI.getFileURL(bg.path);
          return uri.url;
        }
      }
    } catch (error) {
      console.error("Error getting current background:", error);
      return null;
    }

    return null;
  }

  public async playSongInQueue() {
    if (this.queueSongs.length > 0) {
      const song = this.queueSongs.shift();
      if (song) {
        this.playSong(song);
        globalEvent.call("song_queue_play", {
          song,
          queueSongs: this.queueSongs,
          length: this.queueSongs.length,
        });
        globalEvent.call("song_queue_updated", {
          song,
          queueSongs: this.queueSongs,
          length: this.queueSongs.length,
        });
      }
    } else {
      this.currentProcessor?.stop();
      this.playingSong = null;
      await AudioManager.instance().playWaitingMusic();
    }
  }

  public getCurrentTime(): number {
    return this.currentProcessor?.getCurrentPlaybackTime() || 0;
  }
  public getPlayingSong(): Song | null {
    return this.playingSong;
  }
  public getDuration() {
    return this.currentProcessor?.getTotalTime() || 0;
  }
  public getProcessor() {
    return this.currentProcessor;
  }
  public getSynth() {
    return this.synth;
  }

  public getLyricFrames() {
    return this.lyricFrames;
  }

  public clearQueue() {
    this.queueSongs = [];
    globalEvent.call("song_queue_clear");
  }

  public nextSong() {
    this.currentProcessor?.stop();
  }

  public cleanup() {
    this.playingSong = null;
    this.currentProcessor?.cleanup();
    this.currentProcessor = null;
    this.queueSongs = [];
    this.songs = [];
    this.lyricFrames = [];
    this.synth = null;
    this.totalSongs = 0;
    console.log("Cleaning up, please wait...");
  }

  public async getBackgroundsItems(): Promise<string[]> {
    try {
      // if (isPlatformPhone()) {
      //   return Filesystem.readdir({
      //     path: "backgrounds",
      //     directory: Directory.External,
      //   });
      // }

      if (isPlatformDesktop()) {
        const parentFolder = await window.electronAPI.getAppPath();
        const files = await window.electronAPI.openDirectory(
          parentFolder + "/backgrounds"
        );

        const urls = await Promise.all(
          files.map(async (f: any) => {
            const uri = await window.electronAPI.getFileURL(f.path);
            return uri.url;
          })
        );

        return urls;
      }
    } catch (e) {
      return [];
    }

    return [];
  }

  public async getSongsItems() {
    return isPlatformPhone()
      ? Filesystem.readdir({ path: "songs", directory: Directory.External })
      : [];
  }
}
