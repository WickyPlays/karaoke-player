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

    try {
      const dirEntries = await readDir("songs", {
        baseDir: BaseDirectory.Resource,
      });

      // Filter directories first (synchronous operation)
      const songDirectories = dirEntries.filter((entry) => entry.isDirectory);

      // Process each directory sequentially to avoid potential resource issues
      for (const entry of songDirectories) {
        try {
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

          const song = new Song();
          song.number = jsonContent.number;
          song.parentFolder = entry.name;
          song.title = jsonContent.title;
          song.artist = jsonContent.artist;
          song.midiDir = jsonContent.midi_path;
          song.musicMode = jsonContent.music_mode;
          song.midiFileBuffer = midiFileBuffer;

          this.songs.push(song);

          globalEvent.call('song_loaded', {song, loadedCount: this.songs.length, totalCount: dirEntries.length});

        } catch (error) {
          console.error(
            `Error loading song from directory ${entry.name}:`,
            error
          );
          // Continue with next song even if one fails
        }
      }

      console.log(
        `Songs have been loaded. There are ${this.songs.length} songs.`
      );
    } catch (error) {
      console.error("Error loading songs:", error);
      throw error; // Re-throw if you want calling code to handle the error
    }
  }

  public addSongToQueue(song: Song, playIfEmpty: boolean = false) {
    this.queueSongs.push(song);
    globalEvent.call("song_queue_added", {
      song,
      queueSongs: this.queueSongs,
      length: this.queueSongs.length,
    });

    if (
      playIfEmpty &&
      this.playingSong == null &&
      this.queueSongs.length == 1
    ) {
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

  public async playSong(song: Song) {
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

    // Parse lyrics when playing the song
    const midi = await this.currentSeq.getMIDI();
    const orgTracks = midi.tracks.flat();
    const tracks = orgTracks.sort((a, b) => a.ticks - b.ticks);
    const lyricTracks = tracks.filter(
      (track: any) => track.messageStatusByte === 5
    );

    const parsedLyrics = lyricTracks.map((track: any) => ({
      time: midi.MIDIticksToSeconds(track.ticks, midi),
      text: new TextDecoder("windows-1258").decode(track.messageData.buffer),
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

    song.setLyricGroups(lyricGroups);

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
