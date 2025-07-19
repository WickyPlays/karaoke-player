import { Song } from "../obj/song";

export interface LyricNode {
  t: string;
  s: number;
  e: number;
}

export type LyricNodeGroup = LyricNode[];

export interface LyricFrame {
  type:
    | "title_show"
    | "title_hide"
    | "setup"
    | "countdown"
    | "lyric_top"
    | "lyric_bottom"
    | "cooldown_start"
    | "cooldown_end";
  time: number;
  lineIndex?: number;
  countdownFrom?: number;
  metadata?: {
    title: string;
    artist?: string;
    charter?: string;
    lyricist?: string;
  };
  available: boolean;
}

export class LyricParser {
  public static async parseLyricFramesFromSong(song: Song): Promise<{
    lyricGroups: LyricNodeGroup[];
    frames: LyricFrame[];
  }> {
    const file = await window.electronAPI.readTextFile(
      song.getParentFolder() + "\\" + song.getLyricPath()
    );

    if (!file) {
      return { lyricGroups: [], frames: [] };
    }

    try {
      const lyricGroups: LyricNodeGroup[] = JSON.parse(file.content);
      const frames = this.createLyricFrames(song, lyricGroups);
      return { lyricGroups, frames };
    } catch (e) {
      console.error("Failed to parse lyrics:", e);
      return { lyricGroups: [], frames: [] };
    }
  }

  private static createLyricFrames(
    song: Song,
    groups: LyricNodeGroup[]
  ): LyricFrame[] {
    const frames: LyricFrame[] = [];

    if (groups.length === 0) return frames;

    const firstGroup = groups[0];
    const firstGroupStartTime = firstGroup?.[0]?.s || 0;

    // Title frames
    if (firstGroupStartTime >= 3) {
      frames.push({
        type: "title_show",
        time: 0,
        metadata: {
          title: song.getTitle() || "Unknown title",
          artist: song.getArtist() || "Unknown artist",
          charter: song.getCharter() || "Unknown charter",
          lyricist: song.getLyricist() || "Unknown lyricist",
        },
        available: true,
      });

      frames.push({
        type: "title_hide",
        time: firstGroupStartTime - 3,
        available: true,
      });
    }

    // Countdown frames
    const countdownableGroups = groups
      .filter((g, i, arr) => {
        if (!g || g.length === 0) return false;
        const lastGroup = arr[i - 1];
        return (
          lastGroup === undefined ||
          (lastGroup.length > 0 &&
            g[0].s - lastGroup[lastGroup.length - 1]?.e > 6)
        );
      })
      .map((g) => g[0]?.s || 0);

    for (let i = 0; i < countdownableGroups.length; i += 1) {
      for (let j = 3; j >= 0; j -= 1) {
        frames.push({
          type: "countdown",
          time: countdownableGroups[i] - j,
          countdownFrom: j,
          available: true,
        });
      }
    }

    // Initial lyric frames
    if (groups.length >= 1 && groups[0]) {
      frames.push({
        type: "lyric_top",
        time: firstGroupStartTime - 3,
        lineIndex: 0,
        available: true,
      });
    }

    if (groups.length >= 2 && groups[1]) {
      frames.push({
        type: "lyric_bottom",
        time: firstGroupStartTime - 3,
        lineIndex: 1,
        available: true,
      });
    }

    let flipped = false;
    for (let i = 2; i < groups.length; i++) {
      const prevGroup = groups[i - 1];
      const currentGroup = groups[i];

      if (
        !prevGroup ||
        prevGroup.length === 0 ||
        !currentGroup ||
        currentGroup.length === 0
      ) {
        continue;
      }

      const prevGroupEndTime = prevGroup[prevGroup.length - 1]?.e || 0;
      const currentGroupStartTime = currentGroup[0]?.s || 0;
      const timeDiff = currentGroupStartTime - prevGroupEndTime;

      // Handle cooldown between groups
      if (timeDiff > 6) {
        const cooldownStartTime = prevGroupEndTime + 3;
        const cooldownEndTime = currentGroupStartTime - 3;

        frames.push({
          type: "cooldown_start",
          time: cooldownStartTime,
          available: true,
        });

        frames.push({
          type: "cooldown_end",
          time: cooldownEndTime,
          available: true,
        });

        // After cooldown, reset the flip state and add both lines
        frames.push({
          type: "lyric_top",
          time: cooldownEndTime,
          lineIndex: i,
          available: true,
        });

        if (i + 1 < groups.length && groups[i + 1]) {
          frames.push({
            type: "lyric_bottom",
            time: cooldownEndTime,
            lineIndex: i + 1,
            available: true,
          });
          i++;
        }
        flipped = false;
      } else {
        const transitionTime =
          prevGroup[0]?.s +
          (prevGroup[prevGroup.length - 1]?.e - prevGroup[0]?.s) / 2;

        if (!flipped) {
          frames.push({
            type: "lyric_top",
            time: transitionTime,
            lineIndex: i,
            available: true,
          });
        } else {
          frames.push({
            type: "lyric_bottom",
            time: transitionTime,
            lineIndex: i,
            available: true,
          });
        }
        flipped = !flipped;
      }
    }

    return frames.sort((a, b) => a.time - b.time);
  }
}

// const sequencer = new Sequencer(
//   [{ binary: song.getFileBuffer() }],
//   Player.instance().getSynth(),
//   {
//     skipToFirstNoteOn: false,
//     autoPlay: false,
//   }
// );

// const midi = await sequencer.getMIDI();
// if (!midi) return [];

// const orgTracks = midi.tracks.flat();
// const tracks = orgTracks.sort((a: any, b: any) => a.ticks - b.ticks);
// const lyricTracks = tracks.filter(
//   (track: any) => track.messageStatusByte === 5
// );

// const parsedLyrics = lyricTracks.map((track: any) => ({
//   time: midi.MIDIticksToSeconds(track.ticks, midi),
//   text: new TextDecoder("windows-1258").decode(track.messageData.buffer),
// }));

// let lyricGroups: LyricNodeGroup[] = [];
// let currentGroup: LyricNodeGroup = [];

// for (const lyric of parsedLyrics) {
//   if (lyric.text === "\r\n") {
//     if (currentGroup.length > 0) {
//       lyricGroups.push(currentGroup);
//       currentGroup = [];
//     }
//   } else {
//     currentGroup.push(lyric);
//   }
// }

// if (currentGroup.length > 0) {
//   lyricGroups.push(currentGroup);
// }
