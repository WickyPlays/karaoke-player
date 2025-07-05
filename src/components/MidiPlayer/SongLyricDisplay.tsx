import { useEffect, useState, useCallback, useRef } from "react";
import "./SongLyricDisplay.scss";
import globalEvent from "../../cores/global_event";
import { LyricNodeGroup, Song } from "../../cores/songs";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";

interface LyricGap {
  start: number;
  end: number;
  type: "begin" | "middle" | "end";
}

export default function SongLyricDisplay() {
  const midiPlayer = MainMidiPlayer.getInstance();
  const lyricGroupsRef = useRef<LyricNodeGroup[]>([]);
  const lyricOrdersRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number>(0);
  const currTimeRef = useRef<number>(0);

  const [song, setSong] = useState<Song | null>(null);
  const [lines, setLines] = useState<[LyricNodeGroup, LyricNodeGroup]>([
    [],
    [],
  ]);
  const [gaps, setGaps] = useState<LyricGap[]>([]);
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const [activeGap, setActiveGap] = useState<LyricGap | null>(null);

  const updateLyrics = useCallback(() => {
    const lyricGroups = lyricGroupsRef.current;
    const newTime = midiPlayer.getProcessor()?.getCurrentPlaybackTime() || 0;
    currTimeRef.current = newTime;

    const currentGap = gaps.find(
      (gap) => newTime >= gap.start && newTime < gap.end
    );

    if (currentGap) {
      setActiveGap(currentGap);
      setCooldownTime(Math.ceil(currentGap.end - newTime));
      animationFrameRef.current = requestAnimationFrame(updateLyrics);
      return;
    }

    if (activeGap) {
      setActiveGap(null);
      setCooldownTime(0);
    }

    if (!lyricGroups || lyricGroups.length === 0) {
      animationFrameRef.current = requestAnimationFrame(updateLyrics);
      return;
    }

    let currGroupIndex = 0;
    for (let i = 0; i < lyricGroups.length - 1; i++) {
      let groupStartTime = lyricGroups[i][0].time;
      let groupEndTime = lyricGroups[i][lyricGroups[i].length - 1].time;
      if (newTime >= groupEndTime - (groupEndTime - groupStartTime) / 2) {
        currGroupIndex = i + 1;
      } else break;
    }

    let tempLine0Index = 0;
    let tempLine1Index = 1;
    const currentOrders = lyricOrdersRef.current;

    for (let i = 0; i < currGroupIndex; i++) {
      let order = currentOrders[i];

      if (order == 0) {
        tempLine0Index = i + 1;
      } else if (order == 1) {
        tempLine1Index = i + 1;
      }
    }

    tempLine0Index = Math.max(
      0,
      Math.min(tempLine0Index, lyricGroups.length - 1)
    );
    tempLine1Index = Math.max(
      0,
      Math.min(tempLine1Index, lyricGroups.length - 1)
    );

    setLines([lyricGroups[tempLine0Index], lyricGroups[tempLine1Index]]);
    animationFrameRef.current = requestAnimationFrame(updateLyrics);
  }, [gaps, midiPlayer, activeGap]);

  const renderLyricLine = (group: LyricNodeGroup) => {
    return group.map((node, index) => {
      const nextNode = group[index + 1];
      const isLastNode = index === group.length - 1;
      let fillPercentage = 0;

      if (currTimeRef.current >= node.time) {
        if (isLastNode) {
          fillPercentage = 100;
        } else if (nextNode && currTimeRef.current >= nextNode.time) {
          fillPercentage = 100;
        } else if (nextNode) {
          const timeDiff = nextNode.time - node.time;
          const elapsed = currTimeRef.current - node.time;
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
  };

  const initializeSong = useCallback(
    (song: Song) => {
      const groups = song.lyricNodeGroups || [];
      const newGaps: LyricGap[] = [];
      const orders: number[] = [];
      let revolved = false;

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const secondToLastNode = group?.[group.length - 2];
        const lastNode = group?.[group.length - 1];

        if (secondToLastNode && lastNode) {
          group.push({
            time: lastNode.time + (lastNode.time - secondToLastNode.time),
            text: "",
          });
        }

        if (i == 0) {
          orders.push(-1);
          continue;
        }

        const lastGroup = groups[i - 1];
        const currStartTime = groups[i][0].time;
        const lastEndTime = lastGroup[lastGroup.length - 1].time;

        if (lastGroup && currStartTime - lastEndTime > 6) {
          orders[i] = -1;
          revolved = false;
          continue;
        }

        if (!revolved) {
          orders.push(0);
        } else {
          orders.push(1);
        }

        revolved = !revolved;
      }

      const stopIndexes = []
      for (let i = 1; i < orders.length; i++) {
        if (orders[i] == -1) {
          stopIndexes.push(i)
        }
      }
      for (let stopIndex of stopIndexes) {
        orders[stopIndex - 1] = -1
      }

      console.log(orders)
      
      lyricGroupsRef.current = groups;
      lyricOrdersRef.current = orders;
      setSong(song);
      setLines([groups[0] || [], groups[1] || []]);
      setCooldownTime(0);
      setActiveGap(null);

      if (groups.length > 0) {
        const firstGroupTime = groups[0][0].time;
        if (firstGroupTime > 3) {
          newGaps.push({ start: 0, end: firstGroupTime, type: "begin" });
        }

        for (let i = 0; i < groups.length - 1; i++) {
          const currentGroupEnd = groups[i][groups[i].length - 1].time + 3;
          const nextGroupStart = groups[i + 1][0].time;
          const gapDuration = nextGroupStart - currentGroupEnd;

          if (gapDuration > 6) {
            newGaps.push({
              start: currentGroupEnd,
              end: nextGroupStart,
              type: "middle",
            });
          }
        }

        const lastGroupEnd =
          groups[groups.length - 1][groups[groups.length - 1].length - 1].time;
        newGaps.push({ start: lastGroupEnd + 3, end: Infinity, type: "end" });
      }

      setGaps(newGaps);
      animationFrameRef.current = requestAnimationFrame(updateLyrics);
    },
    [updateLyrics]
  );

  useEffect(() => {
    const handleSongPlay = (event: { song: Song }) =>
      initializeSong(event.song);
    const handleSongStopped = () => {
      cancelAnimationFrame(animationFrameRef.current);
      lyricGroupsRef.current = [];
      lyricOrdersRef.current = [];
      setSong(null);
      setLines([[], []]);
      setGaps([]);
      setCooldownTime(0);
      setActiveGap(null);
    };

    animationFrameRef.current = requestAnimationFrame(updateLyrics);
    globalEvent.on("song_played", handleSongPlay);
    globalEvent.on("song_stopped", handleSongStopped);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      globalEvent.off("song_played", handleSongPlay);
      globalEvent.off("song_stopped", handleSongStopped);
    };
  }, [initializeSong, updateLyrics]);

  return (
    <div className="song-lyric-display">
      {song && activeGap && activeGap.type === "begin" && cooldownTime > 3 && (
        <div className="title-container">
          <p className="song-title">{song.title || "Unknown title"}</p>
          <p className="song-meta">Artist: {song.artist || "Unknown"}</p>
          <p className="song-meta">Charter: {song.charter || "Unknown"}</p>
          <p className="song-meta">Lyricist: {song.lyricist || "Unknown"}</p>
        </div>
      )}

      {song && activeGap && activeGap.type === "middle" && cooldownTime > 3 && (
        <div className="middle-container">
          <p>Song is in cooldown</p>
        </div>
      )}

      {cooldownTime <= 3 && cooldownTime > 0 && (
        <p className="cooldown-time">{cooldownTime}</p>
      )}

      <div className="lyric-container">
        {cooldownTime <= 3 && (
          <>
            <div className="lyric-top lyric-line">
              {renderLyricLine(lines[0])}
            </div>
            <div className="lyric-bottom lyric-line">
              {renderLyricLine(lines[1])}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
