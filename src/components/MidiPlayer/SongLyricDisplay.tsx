import { useEffect, useState } from "react";
import "./SongLyricDisplay.scss";
import globalEvent from "../../cores/global_event";
import { LyricNodeGroup, Song } from "../../cores/songs";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";

export default function SongLyricDisplay() {
  const midiPlayer = MainMidiPlayer.getInstance();

  const [topLyricGroup, setTopLyricGroup] = useState<LyricNodeGroup | null>(
    null
  );
  const [bottomLyricGroup, setBottomLyricGroup] =
    useState<LyricNodeGroup | null>(null);

  useEffect(() => {
    function handleSongPlay(event: { song: Song }): void {
      const song = event.song;

      if (song.lyricNodeGroups.length > 0) {
        setTopLyricGroup(song.lyricNodeGroups[0]);
        setBottomLyricGroup(song.lyricNodeGroups[1]);
      }
    }

    function updateLyrics(): void {
      const currTime = midiPlayer.getProcessor()?.getCurrentPlaybackTime() || 0;
    }

    requestAnimationFrame(updateLyrics);

    globalEvent.on("song_play", handleSongPlay);

    return () => {
      globalEvent.off("song_play", handleSongPlay);
    };
  }, []);

  return (
    <div className="song-lyric-display">
      <div className="lyric-container">
        <div className="lyric-top">
          <p
            className="lyric"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #e30000 80%, #ffffff 0%)",
            }}
          >
            {topLyricGroup?.map((lyric) => lyric.text).join("")}
          </p>
        </div>
        <div className="lyric-bottom">
          <p
            className="lyric"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #e30000 80%, #ffffff 0%)",
            }}
          >
            {bottomLyricGroup?.map((lyric) => lyric.text).join("")}
          </p>
        </div>
      </div>
    </div>
  );
}
