import { IKaraokePlayerParser } from "../obj/interfaces";
import { Song, LyricNodeGroup } from "../obj/song";
import { Sequencer } from "spessasynth_lib";
import { Player } from "../init";

export class KaraokePlayerMidiParser implements IKaraokePlayerParser {
  async parseLyrics(song: Song): Promise<LyricNodeGroup[]> {
    if (!song.getFileBuffer()) return [];

    const sequencer = new Sequencer(
      [{ binary: song.getFileBuffer() }],
      Player.instance().getSynth(),
      {
        skipToFirstNoteOn: false,
        autoPlay: false,
      }
    );

    const midi = await sequencer.getMIDI();
    if (!midi) return [];

    const orgTracks = midi.tracks.flat();
    const tracks = orgTracks.sort((a: any, b: any) => a.ticks - b.ticks);
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

    return lyricGroups;
  }
}
