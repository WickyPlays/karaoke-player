export interface ISong {
  number: string;
  parentFolder: string;
  title: string;
  artist: string;
  charter: string;
  lyricist: string;
  midiDir: string;
  musicMode?: string;
  midiFileBuffer?: any;
}

export interface LyricNode {
  time: number;
  text: string;
}

export interface LyricNodeGroup {
  lyricNodes: LyricNode[] | [];
}

export class Song implements ISong {
  private _number: string = '';
  private _parentFolder: string = '';
  private _title: string = '';
  private _artist: string = '';
  private _charter: string = '';
  private _lyricist: string = '';
  private _midiDir: string = '';
  private _musicMode?: string;
  private _midiFileBuffer?: any;
  private _lyricNodeGroups: LyricNodeGroup[] = [];

  constructor() {} // Empty constructor for now since we're using setters

  // Number
  get number(): string {
    return this._number;
  }
  set number(value: string) {
    this._number = value;
  }

  // ParentFolder
  get parentFolder(): string {
    return this._parentFolder;
  }
  set parentFolder(value: string) {
    this._parentFolder = value;
  }

  // Title
  get title(): string {
    return this._title;
  }
  set title(value: string) {
    this._title = value;
  }

  // Artist
  get artist(): string {
    return this._artist;
  }
  set artist(value: string) {
    this._artist = value;
  }

  // Charter
  get charter(): string {
    return this._charter;
  }
  set charter(value: string) {
    this._charter = value;
  }

  // Lyricist
  get lyricist(): string {
    return this._lyricist;
  }
  set lyricist(value: string) {
    this._lyricist = value;
  }

  // MidiDir
  get midiDir(): string {
    return this._midiDir;
  }
  set midiDir(value: string) {
    this._midiDir = value;
  }

  // MusicMode
  get musicMode(): string | undefined {
    return this._musicMode;
  }
  set musicMode(value: string | undefined) {
    this._musicMode = value;
  }

  // MidiFileBuffer
  get midiFileBuffer(): any | undefined {
    return this._midiFileBuffer;
  }
  set midiFileBuffer(value: any | undefined) {
    this._midiFileBuffer = value;
  }

  // LyricNodeGroups
  get lyricNodeGroups(): LyricNodeGroup[] {
    return this._lyricNodeGroups;
  }
  set lyricNodeGroups(value: LyricNodeGroup[]) {
    this._lyricNodeGroups = value;
  }

  setLyricGroups(lyricGroups: LyricNodeGroup[]) {
    this.lyricNodeGroups = lyricGroups;
  }

  toString(): string {
    return `${this.number} - ${this.title} - ${this.artist}`;
  }

  toJSON(): object {
    return {
      number: this.number,
      title: this.title,
      artist: this.artist,
      charter: this.charter,
      lyricist: this.lyricist,
      midiDir: this.midiDir,
    };
  }
}