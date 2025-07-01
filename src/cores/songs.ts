export interface Song {
  number: String;
  parentFolder: String;
  title: String;
  artist: String;
  midiDir: String;
  musicMode?: String;

  //If music mode = midi
  midiFileBuffer?: any;
}

export interface LyricNode {
  time: number;
  text: string;
}

export interface LyricNodeGroup {
  lyricNodes: LyricNode[];
}

export class Song {
  constructor(
    public number: String,
    public parentFolder: String,
    public title: String,
    public artist: String,
    public midiDir: String,
    public musicMode?: String,
    public midiFileBuffer?: any,
    public lyricNodeGroups: LyricNodeGroup[] = []
  ) {}

  setLyricGroups(lyricGroups: LyricNodeGroup[]) {
    this.lyricNodeGroups = lyricGroups;
  }

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