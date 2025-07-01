import {
  BaseDirectory,
  readDir,
  readFile,
  readTextFile,
} from "@tauri-apps/plugin-fs";
import { LyricNodeGroup, Song } from "../songs";
import globalEvent from "../global_event";
import { Synthetizer, Sequencer } from "spessasynth_lib";
import { MidiSongProcessor } from "./midi_song_processor";

export class MainMidiPlayer {
  private static instance: MainMidiPlayer;
  public songs: Song[];
  public queueSongs: Song[] = [];
  public playingSong: Song | null = null;
  public synth: Synthetizer | null;
  private currentSeq: Sequencer | null = null;
  private processor: MidiSongProcessor = null;

  private constructor() {
    this.songs = [];
    this.synth = null;
    this.processor = new MidiSongProcessor(this);
    this.loadSynth();
  }

  public async setup() {
    await this.loadSynth();
    await this.loadAllSongs();
  }

  public async loadSynth() {
    const sfont = await (await fetch("SGM.sf3")).arrayBuffer();
    const ctx = new AudioContext();
    await ctx.audioWorklet
      .addModule("worklet_processor.min.js")
      .then(() => {
        console.log("Worklet loaded");
      })
      .catch((error) => console.error("Error loading worklet:", error));

    const synth = new Synthetizer(ctx.destination, sfont);
    this.synth = synth;
  }

  public async loadAllSongs() {
    this.songs = [];

    const dirEntries = await readDir("songs", {
      baseDir: BaseDirectory.Resource,
    });
    const songPromises = dirEntries
      .filter((entry) => entry.isDirectory)
      .map(async (entry) => {
        const configFile = "songs/" + entry.name + "/config.json";
        const content = await readTextFile(configFile, {
          baseDir: BaseDirectory.Resource,
        });
        const jsonContent = JSON.parse(content);

        const file = await readFile(
          `songs/${entry.name}/${jsonContent.midi_path}`,
          { baseDir: BaseDirectory.Resource }
        );
        const midiFileBuffer = file.buffer;

        const seq = new Sequencer([{ binary: midiFileBuffer }], this.synth, {
          skipToFirstNoteOn: false,
          autoPlay: false,
        });

        const midi = await seq.getMIDI();
        const orgTracks = midi.tracks.flat();
        const tracks = orgTracks.sort((a, b) => a.ticks - b.ticks);
        const lyricTracks = tracks.filter(
          (track: any) => track.messageStatusByte === 5
        );

        const parsedLyrics = lyricTracks.map((track: any) => ({
          time: midi.MIDIticksToSeconds(track.ticks, midi),
          text: new TextDecoder("windows-1258").decode(
            track.messageData.buffer
          ),
        }));

        let lyricGroups: LyricNodeGroup[] = [];
        let currentGroup: LyricNodeGroup = [];

        for (const lyric of parsedLyrics) {
          if (lyric.text === "\r\n") {
            if (currentGroup.length > 0) {
              lyricGroups.push(currentGroup);
              currentGroup = [];
            }
          } else {
            currentGroup.push(lyric);
          }
        }

        if (currentGroup.length > 0) {
          lyricGroups.push(currentGroup);
        }

        const song = new Song();
        song.number = jsonContent.number;
        song.parentFolder = entry.name;
        song.title = jsonContent.title;
        song.artist = jsonContent.artist;
        song.midiDir = jsonContent.midi_path;
        song.musicMode = jsonContent.music_mode;
        song.midiFileBuffer = midiFileBuffer;
        song.lyricNodeGroups = lyricGroups;

        return song;
      });
    const songs = await Promise.all(songPromises);
    songs.forEach((song) => this.songs.push(song));

    console.log(`Song has been loaded. There are ${this.songs.length} songs.`);
  }

  public addSongToQueue(song: Song, playIfEmpty: boolean = false) {
    this.queueSongs.push(song);
    globalEvent.call("song_queue_added", {
      song,
      queueSongs: this.queueSongs,
      length: this.queueSongs.length,
    });

    if (playIfEmpty && this.playingSong == null && this.queueSongs.length == 1) {
      this.playSongInQueue();
    }
  }

  public getLoadedSongs() {
    return this.songs;
  }

  public getQueueSongs() {
    return this.queueSongs;
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

  public playSong(song: Song) {
    this.playingSong = song;
    this.currentSeq = new Sequencer(
      [{ binary: song.midiFileBuffer }],
      this.synth,
      {
        skipToFirstNoteOn: false,
        autoPlay: false,
      }
    );
    this.currentSeq.loop = false;
    this.processor?.processMidiSong(song).then((p) => {
      this.processor?.start();
      globalEvent.call("song_play", { song });
    });
  }

  public playSongInQueue() {
    if (this.queueSongs.length > 0) {
      const song = this.queueSongs[0];
      this.queueSongs = this.queueSongs.slice(1);
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
  }

  public getSynth(): Synthetizer | undefined {
    return this.synth;
  }

  public getCurrentSequencer(): Sequencer | undefined {
    return this.currentSeq;
  }

  public getCurrentTime(): number {
    return this.currentSeq?.currentTime || 0;
  }

  public getPlayingSong(): Song | null {
    return this.playingSong;
  }

  public clearQueue() {
    this.queueSongs = [];
    globalEvent.call("song_queue_clear");
  }

  public getProcessor() {
    return this.processor;
  }

  public static getInstance(): MainMidiPlayer {
    if (!MainMidiPlayer.instance) {
      MainMidiPlayer.instance = new MainMidiPlayer();
    }
    return MainMidiPlayer.instance;
  }
}