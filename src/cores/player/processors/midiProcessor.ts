import { IKaraokePlayerProcessor } from "../obj/interfaces";
import { Song } from "../obj/song";
import { Sequencer } from "spessasynth_lib";
import globalEvent from "src/cores/global_events";
import { KaraokePlayerMidiParser } from "../parsers/midiParsers";
import { Player } from "../init";

type MidiEvent = {
  id: number;
  statusByte: number;
  message: Uint8Array;
  time: number;
  available: boolean;
};

export class KaraokePlayerMidiProcessor implements IKaraokePlayerProcessor {
  private song: Song | null = null;
  private synth: Synthetizer | null = null;
  private startTimestamp: number | null = null;
  private pauseTimestamp: number | null = null;
  private accumulatedPausedTime = 0;
  private totalTime = 0;
  private events: MidiEvent[] = [];
  private animationFrameId: number | null = null;
  private isPlaying = false;
  private isPaused = false;
  private speed = 1.0;
  private sequencer: Sequencer | null = null;
  private parser: KaraokePlayerMidiParser;

  constructor() {
    this.parser = new KaraokePlayerMidiParser();
  }

  public async processSong(song: Song): Promise<Song> {
    this.cleanup();

    this.song = song;
    this.synth = Player.instance().getSynth();

    if (!this.synth) {
      throw new Error("Synthesizer not initialized");
    }

    this.sequencer = new Sequencer([{ binary: song.getFileBuffer() }], this.synth, {
      skipToFirstNoteOn: false,
      autoPlay: false,
    });
    this.sequencer.loop = false;

    const midi = await this.sequencer.getMIDI();
    if (!midi) return song;

    this.totalTime = midi.duration + 1;

    const orgTracks = midi.tracks.flat();
    const tracks = orgTracks.sort((a: any, b: any) => a.ticks - b.ticks);

    this.events = tracks.map((track: any, id: number) => {
      const data = Array.from(new Uint8Array(track.messageData));
      const mergedArray = [track.messageStatusByte, ...data];
      return {
        id: id,
        statusByte: track.messageStatusByte,
        message: Uint8Array.from(mergedArray),
        time: midi.MIDIticksToSeconds(track.ticks, midi),
        available: true,
      };
    });

    // Parse lyrics
    const lyricGroups = await this.parser.parseLyrics(song);
    song.setLyricNodeGroups(lyricGroups);

    return song;
  }

  public start() {
    if (this.isPlaying && !this.isPaused) return;

    if (this.isPaused) {
      this.resume();
      return;
    }

    this.events.forEach((event) => (event.available = true));
    this.accumulatedPausedTime = 0;
    this.startTimestamp = Date.now();
    this.isPlaying = true;
    this.isPaused = false;
    this.startAnimationFrame();
  }

  public pause() {
    if (!this.isPlaying || this.isPaused) return;

    this.setSpeed(1);
    this.pauseTimestamp = Date.now();
    this.isPaused = true;
    this.sendAllNotesOff();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resume() {
    if (!this.isPlaying || !this.isPaused) return;

    if (this.pauseTimestamp) {
      this.accumulatedPausedTime += Date.now() - this.pauseTimestamp;
      this.pauseTimestamp = null;
    }

    this.isPaused = false;
    this.startAnimationFrame();
  }

  public stop() {
    if (!this.isPlaying && !this.isPaused) return;

    this.isPlaying = false;
    this.isPaused = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.startTimestamp = null;
    this.pauseTimestamp = null;
    this.accumulatedPausedTime = 0;

    this.sendAllNotesOff();
    globalEvent.call("song_stopped", { song: this.song });
  }

  private sendAllNotesOff() {
    if (!this.synth) return;

    try {
      for (let channel = 0; channel < 16; channel++) {
        this.synth.sendMessage([0xb0 + channel, 0x7b, 0x00]);
      }
    } catch (error) {
      console.error("Error sending all notes off:", error);
    }
  }

  private startAnimationFrame() {
    const update = () => {
      if (!this.isPlaying || this.isPaused) return;

      this.updateFrame();
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  private updateFrame() {
    if (!this.startTimestamp || !this.isPlaying || this.isPaused) return;

    const currentTime =
      ((Date.now() - this.startTimestamp - this.accumulatedPausedTime) / 1000) *
      this.speed;

    if (!this.synth) return;

    for (const event of this.events) {
      if (event.available && event.time <= currentTime) {
        try {
          this.synth.sendMessage(event.message);
          event.available = false;
        } catch (error) {
          console.error("Error sending MIDI message:", error);
        }
      }
    }

    const allEventsProcessed = this.events.every((event) => !event.available);
    if (allEventsProcessed) {
      this.stop();
    }
  }

  public getSpeed(): number {
    return this.speed;
  }

  public setSpeed(speed: number) {
    if (speed <= 0) {
      console.warn("Speed must be greater than 0");
      return;
    }

    if (this.isPlaying && !this.isPaused && this.startTimestamp) {
      const currentTime = this.getCurrentPlaybackTime();
      this.accumulatedPausedTime =
        Date.now() - this.startTimestamp - (currentTime * 1000) / this.speed;
      this.startTimestamp = Date.now() - (currentTime * 1000) / speed;
    }

    this.speed = speed;
    globalEvent.call("song_speed_changed", { speed });
  }

  public getSong(): Song | null {
    return this.song;
  }

  public isRunning(): boolean {
    return this.isPlaying;
  }

  public isPausedState(): boolean {
    return this.isPaused;
  }

  public getCurrentPlaybackTime(): number {
    if (!this.startTimestamp) return 0;

    if (this.isPaused && this.pauseTimestamp) {
      return (
        ((this.pauseTimestamp -
          this.startTimestamp -
          this.accumulatedPausedTime) /
          1000) *
        this.speed
      );
    }

    if (!this.isPlaying) return 0;

    return (
      ((Date.now() - this.startTimestamp - this.accumulatedPausedTime) / 1000) *
      this.speed
    );
  }

  public getTotalTime(): number {
    return this.totalTime;
  }

  public cleanup() {
    this.stop();
    this.events = [];
    this.song = null;
    this.totalTime = 0;
    this.sequencer = null;
  }
}
