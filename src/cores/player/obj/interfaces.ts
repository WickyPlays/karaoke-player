import { Song, LyricNodeGroup } from "./song";

export interface IKaraokePlayerProcessor {
  processSong(song: Song): Promise<Song>;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getSpeed(): number;
  setSpeed(speed: number): void;
  getCurrentPlaybackTime(): number;
  getTotalTime(): number;
  cleanup(): void;
  isRunning(): boolean;
  isPausedState(): boolean;
}

export interface IKaraokePlayerParser {
  parseLyrics(song: Song): Promise<LyricNodeGroup[]>;
}
