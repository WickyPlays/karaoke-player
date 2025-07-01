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
  private midiPlayer: MainMidiPlayer | undefined;
  private totalTime = 0;
  private events: MidiEvent[] = [];
  private animationFrameId: number | null = null;
  private isPlaying = false;

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
    if (this.isPlaying) return;
    
    this.startTimestamp = Date.now();
    this.isPlaying = true;
    this.startAnimationFrame();
  }

  public stop() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.startTimestamp = null;
  }

  private startAnimationFrame() {
    const update = () => {
      if (!this.isPlaying) return;
      
      this.updateFrame();
      this.animationFrameId = requestAnimationFrame(update);
    };
    
    this.animationFrameId = requestAnimationFrame(update);
  }

  private updateFrame() {
    if (!this.startTimestamp || !this.isPlaying) return;
    
    const currentTime = (Date.now() - this.startTimestamp) / 1000;
    
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

  public getCurrentPlaybackTime(): number {
    if (!this.startTimestamp || !this.isPlaying) return 0;
    return (Date.now() - this.startTimestamp) / 1000;
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