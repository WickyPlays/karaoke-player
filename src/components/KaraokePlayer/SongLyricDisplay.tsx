import { useEffect, useState, useCallback, useRef } from "react";
import "./SongLyricDisplay.scss";
import globalEvent from "../../cores/global_event";
import { LyricNodeGroup, Song } from "../../cores/songs";
import { MainPlayerCore } from "../../cores/KaraokePlayer/main_player_core";

interface LyricFrame {
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

export default function SongLyricDisplay() {
  const midiPlayer = MainPlayerCore.getInstance();
  const animationFrameRef = useRef<number>(0);
  const currTimeRef = useRef<number>(0);
  const framesRef = useRef<LyricFrame[]>([]);
  const lyricGroupsRef = useRef<LyricNodeGroup[]>([]);
  const titleVisibleRef = useRef<boolean>(false);
  const processedFramesRef = useRef<Set<number>>(new Set());

  const [song, setSong] = useState<Song | null>(null);
  const [currentFrame, setCurrentFrame] = useState<LyricFrame | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [topLine, setTopLine] = useState<LyricNodeGroup>([]);
  const [bottomLine, setBottomLine] = useState<LyricNodeGroup>([]);
  const [showTitle, setShowTitle] = useState<boolean>(false);
  const [inCooldown, setInCooldown] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const updateLyrics = useCallback(() => {
    const newTime = midiPlayer.getProcessor()?.getCurrentPlaybackTime() || 0;
    currTimeRef.current = newTime;
    setCurrentTime(newTime);
    const frames = framesRef.current;
    const lyricGroups = lyricGroupsRef.current;

    if (!frames || frames.length === 0 || lyricGroups.length === 0) {
      animationFrameRef.current = requestAnimationFrame(updateLyrics);
      return;
    }

    let latestFrame: LyricFrame | null = null;

    frames.forEach((frame, index) => {
      if (
        newTime >= frame.time &&
        frame.available &&
        !processedFramesRef.current.has(index)
      ) {
        latestFrame = frame;
        processedFramesRef.current.add(index);

        if (frame.type === "title_show") {
          setShowTitle(true);
          titleVisibleRef.current = true;
        } else if (frame.type === "title_hide") {
          setShowTitle(false);
          titleVisibleRef.current = false;
        }

        if (frame.type === "countdown") {
          setCountdownValue(
            frame.countdownFrom > 0 ? frame.countdownFrom : null
          );
        }

        if (frame.type === "lyric_top") {
          if (frame.lineIndex !== undefined) {
            setTopLine(lyricGroups[frame.lineIndex]);
          } else {
            setTopLine([]);
          }
        }

        if (frame.type === "lyric_bottom") {
          if (frame.lineIndex !== undefined) {
            setBottomLine(lyricGroups[frame.lineIndex]);
          } else {
            setBottomLine([]);
          }
        }

        if (frame.type === "cooldown_start") {
          setInCooldown(true);
        } else if (frame.type === "cooldown_end") {
          setInCooldown(false);
        }

        framesRef.current = frames.map((f, i) =>
          i === index ? { ...f, available: false } : f
        );
      }
    });

    setCurrentFrame(latestFrame);
    animationFrameRef.current = requestAnimationFrame(updateLyrics);
  }, [midiPlayer, countdownValue]);

  const renderLyricLine = (group: LyricNodeGroup) => {
    return group.map((node, index) => {
      const nextNode = group[index + 1];
      const isLastNode = index === group.length - 1;
      let fillPercentage = 0;

      if (currentTime >= node.time) {
        if (isLastNode) {
          fillPercentage = 100;
        } else if (nextNode && currentTime >= nextNode.time) {
          fillPercentage = 100;
        } else if (nextNode) {
          const timeDiff = nextNode.time - node.time;
          const elapsed = currentTime - node.time;
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

  const createLyricFrames = (song: Song): LyricFrame[] => {
    const frames: LyricFrame[] = [];
    const groups = song.lyricNodeGroups || [];
    lyricGroupsRef.current = groups;

    if (groups.length === 0) return frames;

    const firstGroupStartTime = groups[0][0].time;

    // Title procurement
    if (firstGroupStartTime >= 3) {
      frames.push({
        type: "title_show",
        time: 0,
        metadata: {
          title: song.title || "Unknown title",
          artist: song.artist,
          charter: song.charter,
          lyricist: song.lyricist,
        },
        available: true,
      });

      frames.push({
        type: "title_hide",
        time: firstGroupStartTime - 3,
        available: true,
      });
    }

    // Countdown procurement
    const countdownableGroups = groups
      .filter((g, i, arr) => {
        const lastGroup = arr[i - 1];
        return (
          lastGroup === undefined ||
          g[0].time - lastGroup[lastGroup.length - 1].time > 6
        );
      })
      .map((g) => g[0].time);

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

    // Lyrics procurement with cooldown handling
    if (groups.length >= 1) {
      frames.push({
        type: "lyric_top",
        time: firstGroupStartTime - 3,
        lineIndex: 0,
        available: true,
      });
    }

    if (groups.length >= 2) {
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
      const timeDiff =
        currentGroup[0].time - prevGroup[prevGroup.length - 1].time;

      // Check if there's a significant gap (>6s) between groups
      if (timeDiff > 6) {
        const cooldownStartTime = prevGroup[prevGroup.length - 1].time + 3;
        const cooldownEndTime = currentGroup[0].time - 3;

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

        if (i + 1 < groups.length) {
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
        if (!flipped) {
          frames.push({
            type: "lyric_top",
            time:
              prevGroup[0].time +
              (prevGroup[prevGroup.length - 1].time - prevGroup[0].time) / 2,
            lineIndex: i,
            available: true,
          });
        } else {
          frames.push({
            type: "lyric_bottom",
            time:
              prevGroup[0].time +
              (prevGroup[prevGroup.length - 1].time - prevGroup[0].time) / 2,
            lineIndex: i,
            available: true,
          });
        }
        flipped = !flipped;
      }
    }

    const sortedFrames = frames.sort((a, b) => a.time - b.time);
    return sortedFrames;
  };

  const initializeSong = useCallback(
    (song: Song) => {
      const frames = createLyricFrames(song);
      framesRef.current = frames;
      processedFramesRef.current = new Set();
      setSong(song);
      setCurrentFrame(null);
      setCountdownValue(null);
      setTopLine([]);
      setBottomLine([]);
      setShowTitle(false);
      setInCooldown(false);
      titleVisibleRef.current = false;
      animationFrameRef.current = requestAnimationFrame(updateLyrics);
    },
    [updateLyrics]
  );

  useEffect(() => {
    const handleSongPlay = (event: { song: Song }) =>
      initializeSong(event.song);
    const handleSongStopped = () => {
      cancelAnimationFrame(animationFrameRef.current);
      framesRef.current = [];
      lyricGroupsRef.current = [];
      processedFramesRef.current = new Set();
      setSong(null);
      setCurrentFrame(null);
      setCountdownValue(null);
      setTopLine([]);
      setBottomLine([]);
      setShowTitle(false);
      setInCooldown(false);
      titleVisibleRef.current = false;
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
      {showTitle && (
        <div className="title-container">
          <p className="song-title">{song?.title}</p>
          <p className="song-meta">Artist: {song?.artist || "Unknown"}</p>
          <p className="song-meta">Charter: {song?.charter || "Unknown"}</p>
          <p className="song-meta">Lyricist: {song?.lyricist || "Unknown"}</p>
        </div>
      )}

      {inCooldown && (
        <div className="middle-container">
          <p>Song is in cooldown</p>
        </div>
      )}

      {countdownValue !== null && (
        <p className="cooldown-time">{countdownValue}</p>
      )}

      {!inCooldown && (
        <div className="lyric-container">
          <div className="lyric-top lyric-line">{renderLyricLine(topLine)}</div>
          <div className="lyric-bottom lyric-line">
            {renderLyricLine(bottomLine)}
          </div>
        </div>
      )}
    </div>
  );
}
