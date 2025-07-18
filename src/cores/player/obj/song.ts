export interface ISong {
  number: string;
  parentFolder: string;
  title: string;
  titleTranslit?: string | undefined;
  artist: string;
  charter: string;
  lyricist: string;
  songPath: string;
  lyricPath?: string | undefined;
  judgementPath?: string | undefined;
  fileBuffer?: ArrayBuffer | undefined;
  songType: SongType;
}

export type LyricNode = {
  time: number;
  text: string;
};

export enum SongType {
  NONE = "none",
  MIDI = "midi",
  AUDIO = "audio",
}

export type LyricNodeGroup = LyricNode[];

export class Song implements ISong {
  private _number: string;
  private _parentFolder: string;
  private _title: string;
  private _titleTranslit?: string | undefined;
  private _artist: string;
  private _charter: string;
  private _lyricist: string;
  private _songPath: string;
  private _lyricPath?: string | undefined;
  private _judgementPath?: string | undefined;
  private _fileBuffer?: ArrayBuffer | undefined;
  private _lyricNodeGroups: LyricNodeGroup[] = [];
  private _songType: SongType;

  constructor(init?: Partial<ISong>) {
    this._number = init?.number ?? "";
    this._parentFolder = init?.parentFolder ?? "";
    this._title = init?.title ?? "";
    this._titleTranslit = init?.titleTranslit;
    this._artist = init?.artist ?? "";
    this._charter = init?.charter ?? "";
    this._lyricist = init?.lyricist ?? "";
    this._songPath = init?.songPath ?? "";
    this._lyricPath = init?.lyricPath;
    this._judgementPath = init?.judgementPath;
    this._fileBuffer = init?.fileBuffer;
    this._songType = init?.songType ?? SongType.NONE;
  }

  getNumber(): string {
    return this._number;
  }
  setNumber(value: string): this {
    this._number = value;
    return this;
  }

  getParentFolder(): string {
    return this._parentFolder;
  }
  setParentFolder(value: string): this {
    this._parentFolder = value;
    return this;
  }

  getTitle(): string {
    return this._title;
  }
  setTitle(value: string): this {
    this._title = value;
    return this;
  }

  getTitleTranslit(): string | undefined {
    return this._titleTranslit;
  }
  setTitleTranslit(value: string | undefined): this {
    this._titleTranslit = value;
    return this;
  }

  getArtist(): string {
    return this._artist;
  }
  setArtist(value: string): this {
    this._artist = value;
    return this;
  }

  getCharter(): string {
    return this._charter;
  }
  setCharter(value: string): this {
    this._charter = value;
    return this;
  }

  getLyricist(): string {
    return this._lyricist;
  }
  setLyricist(value: string): this {
    this._lyricist = value;
    return this;
  }

  getSongPath(): string {
    return this._songPath;
  }
  setSongPath(value: string): this {
    this._songPath = value;
    return this;
  }

  getLyricPath(): string | undefined {
    return this._lyricPath;
  }
  setLyricPath(value: string | undefined): this {
    this._lyricPath = value;
    return this;
  }

  getJudgementPath(): string | undefined {
    return this._judgementPath;
  }
  setJudgementPath(value: string | undefined): this {
    this._judgementPath = value;
    return this;
  }

  getFileBuffer(): ArrayBuffer | undefined {
    return this._fileBuffer;
  }
  setFileBuffer(value: ArrayBuffer | undefined): this {
    this._fileBuffer = value;
    return this;
  }

  getLyricNodeGroups(): LyricNodeGroup[] {
    return this._lyricNodeGroups;
  }
  setLyricNodeGroups(value: LyricNodeGroup[]): this {
    this._lyricNodeGroups = value;
    return this;
  }

  getSongType(): SongType {
    return this._songType;
  }
  setSongType(value: SongType): this {
    this._songType = value;
    return this;
  }

  addLyricGroup(group: LyricNodeGroup): this {
    this._lyricNodeGroups.push(group);
    return this;
  }

  clearLyricGroups(): this {
    this._lyricNodeGroups = [];
    return this;
  }

  toString(): string {
    return `${this._number} - ${this._title} - ${this._artist}`;
  }

  toJSON(): object {
    return {
      number: this._number,
      parentFolder: this._parentFolder,
      title: this._title,
      titleTranslit: this._titleTranslit,
      artist: this._artist,
      charter: this._charter,
      lyricist: this._lyricist,
      songPath: this._songPath,
      lyricPath: this._lyricPath,
      judgementPath: this._judgementPath,
      songType: this._songType,
    };
  }
}
