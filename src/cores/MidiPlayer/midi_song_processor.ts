import { Song } from "../songs";
import { MainMidiPlayer } from "./main_midi_player";

interface MidiEvent {
  id: number;
  statusByte: number;
  message: Uint8Array;
  time: number;
  available: boolean;
}

export class MidiSongProcessor {
  private song: Song | null = null;
  private startTimestamp: number | null = null;
  private pauseTimestamp: number | null = null;
  private accumulatedPausedTime = 0;
  private midiPlayer: MainMidiPlayer | undefined;
  private totalTime = 0;
  private events: MidiEvent[] = [];
  private animationFrameId: number | null = null;
  private isPlaying = false;
  private isPaused = false;

  constructor(midiPlayer: MainMidiPlayer) {
    this.midiPlayer = midiPlayer;
  }

  public async processMidiSong(song: Song) {
    this.song = song;
    const seq = this.midiPlayer?.getCurrentSequencer();
    if (!seq) return song;

    const midi = await seq.getMIDI();
    if (midi == null) return song;

    this.totalTime = midi.duration + 1;

    const orgTracks = midi.tracks.flat();
    const tracks = orgTracks.sort((a, b) => a.ticks - b.ticks);

    this.events = tracks.map((track, id) => {
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
    
    return song;
  }

  public start() {
    if (this.isPlaying && !this.isPaused) return;
    
    if (this.isPaused) {
      this.resume();
      return;
    }
    
    // Reset all events to available when starting fresh
    this.events.forEach(event => event.available = true);
    this.accumulatedPausedTime = 0;
    this.startTimestamp = Date.now();
    this.isPlaying = true;
    this.isPaused = false;
    this.startAnimationFrame();
  }

  public pause() {
    if (!this.isPlaying || this.isPaused) return;
    
    this.pauseTimestamp = Date.now();
    this.isPaused = true;
    
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
    
    // Send all notes off when stopping
    this.sendAllNotesOff();
  }

  private sendAllNotesOff() {
    const synth = this.midiPlayer?.getSynth();
    if (!synth) return;

    try {
      // Send all notes off on all channels (1-16)
      for (let channel = 0; channel < 16; channel++) {
        synth.sendMessage([0xB0 + channel, 0x7B, 0x00]); // All Notes Off
      }
    } catch (error) {
      console.error('Error sending all notes off:', error);
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
    
    const currentTime = (Date.now() - this.startTimestamp - this.accumulatedPausedTime) / 1000;
    
    const synth = this.midiPlayer?.getSynth();
    if (!synth) return;

    // Process all available events that are due
    for (const event of this.events) {
      if (event.available && event.time <= currentTime) {
        try {
          synth.sendMessage(event.message);
          event.available = false;
        } catch (error) {
          console.error('Error sending MIDI message:', error);
        }
      }
    }

    // Check if all events have been processed
    const allEventsProcessed = this.events.every(event => !event.available);
    if (allEventsProcessed) {
      this.stop();
    }
  }

  public getSong(): Song | null {
    return this.song;
  }

  public getMidiPlayer() {
    return this.midiPlayer;
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
      return (this.pauseTimestamp - this.startTimestamp - this.accumulatedPausedTime) / 1000;
    }
    
    if (!this.isPlaying) return 0;
    
    return (Date.now() - this.startTimestamp - this.accumulatedPausedTime) / 1000;
  }

  public getTotalTime(): number {
    return this.totalTime;
  }

  public cleanup() {
    this.stop();
    this.events = [];
    this.song = null;
    this.totalTime = 0;
  }
}