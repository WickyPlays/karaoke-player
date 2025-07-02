import { useEffect, useState, useCallback, useRef } from "react";
import "./SongLyricDisplay.scss";
import globalEvent from "../../cores/global_event";
import { LyricNodeGroup, Song } from "../../cores/songs";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";

interface LyricGap {
  start: number;
  end: number;
  type: 'begin' | 'middle' | 'end';
}

//TODO: Trying to fix lyric display last letter snapping...
export default function SongLyricDisplay() {
  const midiPlayer = MainMidiPlayer.getInstance();

  const lyricGroupsRef = useRef<LyricNodeGroup[]>([]);
  const [currTime, setCurrTime] = useState(0);
  const [topGroup, setTopGroup] = useState<LyricNodeGroup | []>([]);
  const [bottomGroup, setBottomGroup] = useState<LyricNodeGroup | []>([]);
  const [gaps, setGaps] = useState<LyricGap[]>([]);
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const animationFrameRef = useRef<number>(0);

  const updateLyrics = useCallback(() => {
    const lyricGroups = lyricGroupsRef.current || [];
    const newTime = midiPlayer.getProcessor()?.getCurrentPlaybackTime() || 0;
    
    setCurrTime(newTime);

    const currentGap = gaps.find(gap => newTime >= gap.start && newTime < gap.end);
    
    if (currentGap) {
      const remainingTime = Math.ceil(currentGap.end - newTime);
      setCooldownTime(remainingTime);
      
      animationFrameRef.current = requestAnimationFrame(updateLyrics);
      return;
    } else {
      setCooldownTime(0);
    }

    let newTopGroupIndex = 0;
    let newBottomGroupIndex = 1;
    let flipped = false;
    let firstTime = false;
    
    for (let i = 0; i < lyricGroups.length - 1; i++) {
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
          continue;
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

    animationFrameRef.current = requestAnimationFrame(updateLyrics);
  }, [gaps, midiPlayer]);

  useEffect(() => {
    function handleSongPlay(event: { song: Song }): void {
      const song = event.song;
      setCurrTime(0);
      const groups = song.lyricNodeGroups || [];
      lyricGroupsRef.current = groups;
      setTopGroup([]);
      setBottomGroup([]);
      setCooldownTime(0);

      // Calculate gaps
      const newGaps: LyricGap[] = [];
      
      // Add begin gap (3 seconds before first lyric)
      if (groups.length > 0) {
        const firstGroupTime = groups[0][0].time;
        if (firstGroupTime > 3) {
          newGaps.push({ start: 0, end: firstGroupTime, type: 'begin' });
        }
      }

      // Add middle gaps (3 seconds between groups)
      for (let i = 0; i < groups.length - 1; i++) {
        const currentGroupEnd = groups[i][groups[i].length - 1].time + 3;
        const nextGroupStart = groups[i + 1][0].time;
        const gapDuration = nextGroupStart - currentGroupEnd;
        
        if (gapDuration > 6) {
          newGaps.push({
            start: currentGroupEnd,
            end: nextGroupStart,
            type: 'middle'
          });
        }
      }

      // Add end gap (3 seconds after last lyric)
      if (groups.length > 0) {
        const lastGroupEnd = groups[groups.length - 1][groups[groups.length - 1].length - 1].time;
        newGaps.push({ start: lastGroupEnd, end: Infinity, type: 'end' });
      }

      setGaps(newGaps);
    }

    animationFrameRef.current = requestAnimationFrame(updateLyrics);
    globalEvent.on("song_played", handleSongPlay);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      globalEvent.off("song_played", handleSongPlay);
    };
  }, [updateLyrics]);

  const renderLyricLine = useCallback((group: LyricNodeGroup | null) => {
    if (!group || group.length === 0) return null;

    return group.map((node, index: number) => {
      let fillPercentage = 0;
      const nextNode = group[index + 1];
      const isLastNode = index === group.length - 1;

      if (currTime >= node.time) {
        if (isLastNode) {
          // For the last node, we'll keep it filled until the next group starts
          fillPercentage = 100;
        } else if (nextNode && currTime >= nextNode.time) {
          fillPercentage = 100;
        } else if (nextNode) {
          const timeDiff = nextNode.time - node.time;
          const elapsed = currTime - node.time;
          fillPercentage = Math.min((elapsed / timeDiff) * 100, 100);
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

  const inGap = gaps.some(gap => currTime >= gap.start && currTime < gap.end);

  return (
    <div className="song-lyric-display">
      {inGap && cooldownTime <= 3 && (
        <p className="cooldown-time">{cooldownTime}</p>
      )}
      <div className="lyric-container">
        {cooldownTime <= 3 && (
          <>
            <div className="lyric-top lyric-line">
              {renderLyricLine(topGroup)}
            </div>
            <div className="lyric-bottom lyric-line">
              {renderLyricLine(bottomGroup)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}