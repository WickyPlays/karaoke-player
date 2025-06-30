export interface Song {
  number: String;
  title: String;
  artist: String;
  midiDir: String;
}

export class Song {
  constructor(
    public number: String,
    public title: String,
    public artist: String,
    public midiDir: String,
  ) {}

  toString(): String {
    return `${this.number} - ${this.title} - ${this.artist}`;
  }

  toJSON(): Object {
    return {
      number: this.number,
      title: this.title,
      artist: this.artist,
      midiDir: this.midiDir,
    };
  }
}