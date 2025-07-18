import { IKaraokePlayerProcessor } from "../obj/interfaces";
import { Song } from "../obj/song";
import { Howl, Howler } from "howler";
import globalEvent from "src/cores/global_events";

export class KaraokePlayerAudioProcessor implements IKaraokePlayerProcessor {
  private song: Song | null = null;
  private howl: Howl | null = null;
  private isPlaying = false;
  private isPaused = false;
  private startTime = 0;
  private pausePosition = 0;
  private speed = 1.0;

  async processSong(song: Song): Promise<Song> {
    this.cleanup();
    this.song = song;

    // Create audio blob from file buffer
    const blob = new Blob([song.fileBuffer], { type: this.getMimeType(song) });
    const url = URL.createObjectURL(blob);

    this.howl = new Howl({
      src: [url],
      html5: true,
      onend: () => this.stop(),
      onplay: () => {
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = Date.now() - this.pausePosition * 1000;
      },
      onpause: () => {
        this.isPaused = true;
        this.pausePosition = this.howl?.seek() as number;
      },
      onstop: () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.pausePosition = 0;
      },
    });

    return song;
  }

  start(): void {
    if (!this.howl) return;

    if (this.isPaused) {
      this.resume();
      return;
    }

    this.howl.play();
    this.startTime = Date.now();
  }

  pause(): void {
    if (!this.howl || !this.isPlaying || this.isPaused) return;
    this.howl.pause();
  }

  resume(): void {
    if (!this.howl || !this.isPaused) return;
    this.howl.play();
  }

  stop(): void {
    if (!this.howl) return;
    this.howl.stop();
    this.isPlaying = false;
    this.isPaused = false;
    globalEvent.call("song_stopped", { song: this.song });
  }

  getSpeed(): number {
    throw new Error("Method not implemented.");
  }

  setSpeed(speed: number): void {
    if (!this.howl || speed <= 0) return;
    this.speed = speed;
    this.howl.rate(speed);
    globalEvent.call("song_speed_changed", { speed });
  }

  getCurrentPlaybackTime(): number {
    if (!this.howl) return 0;
    return this.howl.seek() as number;
  }

  getTotalTime(): number {
    if (!this.howl) return 0;
    return this.howl.duration();
  }

  cleanup(): void {
    this.stop();
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }
    this.song = null;
  }

  isRunning(): boolean {
    return this.isPlaying;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  private getMimeType(song: Song): string {
    const ext = song.getSongPath().split(".").pop()?.toLowerCase();
    switch (ext) {
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "ogg":
        return "audio/ogg";
      case "m4a":
        return "audio/mp4";
      default:
        return "audio/mpeg";
    }
  }
}
