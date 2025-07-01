import { useEffect, useState, useCallback, useRef } from "react";
import "./SongLyricDisplay.scss";
import globalEvent from "../../cores/global_event";
import { LyricNodeGroup, Song } from "../../cores/songs";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";

export default function SongLyricDisplay() {
  const midiPlayer = MainMidiPlayer.getInstance();

  const lyricGroupsRef = useRef<LyricNodeGroup[]>([]);
  const [currTime, setCurrTime] = useState(0);
  const [topGroup, setTopGroup] = useState<LyricNodeGroup | []>([]);
  const [bottomGroup, setBottomGroup] = useState<LyricNodeGroup | []>([]);

  const updateLyrics = useCallback(() => {
    const lyricGroups = lyricGroupsRef.current || [] as LyricNodeGroup[];
    const newTime = midiPlayer.getProcessor()?.getCurrentPlaybackTime() || 0;
    
    setCurrTime(newTime);

    let newTopGroupIndex = 0;
    let newBottomGroupIndex = 1;
    let flipped = false;
    let firstTime = false;
    
    for (let i = 0; i < lyricGroups.length; i++) {
      const group = lyricGroups[i];
      const startGroupTime = group[0].time;
      const endGroupTime = group[group.length - 1].time;
      const avgTime = (startGroupTime + endGroupTime) / 2;

      if (newTime < startGroupTime) {
        break;
      }

      if (newTime > endGroupTime || newTime >= avgTime) {
        if (!firstTime) {
          firstTime = true;
          continue
        }

        if (!flipped) {
          newTopGroupIndex += 2;
        } else {
          newBottomGroupIndex += 2;
        }
        flipped = !flipped;
      }
    }

    newTopGroupIndex = Math.min(newTopGroupIndex, lyricGroups.length - 1);
    newBottomGroupIndex = Math.min(newBottomGroupIndex, lyricGroups.length - 1);

    setTopGroup(lyricGroups[newTopGroupIndex] || []);
    setBottomGroup(lyricGroups[newBottomGroupIndex] || []);

    requestAnimationFrame(updateLyrics);
  }, []);

  useEffect(() => {
    function handleSongPlay(event: { song: Song }): void {
      const song = event.song;
      setCurrTime(0);
      lyricGroupsRef.current = (song.lyricNodeGroups || []);
      setTopGroup([]);
      setBottomGroup([]);
    }

    const animationFrame = requestAnimationFrame(updateLyrics);
    globalEvent.on("song_play", handleSongPlay);

    return () => {
      cancelAnimationFrame(animationFrame);
      globalEvent.off("song_play", handleSongPlay);
    };
  }, [updateLyrics]);

  const renderLyricLine = useCallback((group: LyricNodeGroup | null) => {
    if (!group || group.length === 0) return null;

    return group.map((node, index: number) => {
      let fillPercentage = 0;
      const nextNode = group[index + 1];

      if (currTime >= node.time) {
        if (!nextNode || currTime >= nextNode.time) {
          fillPercentage = 100;
        } else {
          const timeDiff = nextNode.time - node.time;
          const elapsed = currTime - node.time;
          fillPercentage = Math.min(100, (elapsed / timeDiff) * 100) + 5;
        }
      }

      return (
        <p
          key={`${index}-${node.time}`}
          className={`lyric-letter ${node.text === " " ? "whitespace" : ""}`}
          style={{
            backgroundImage: `linear-gradient(90deg, #e30000 ${fillPercentage}%, #ffffff ${fillPercentage}%)`,
          }}
        >
          {node.text}
        </p>
      );
    });
  }, [currTime]);

  return (
    <div className="song-lyric-display">
      <div className="lyric-container">
        <div className="lyric-top lyric-line">
          {renderLyricLine(topGroup)}
        </div>
        <div className="lyric-bottom lyric-line">
          {renderLyricLine(bottomGroup)}
        </div>
      </div>
    </div>
  );
}