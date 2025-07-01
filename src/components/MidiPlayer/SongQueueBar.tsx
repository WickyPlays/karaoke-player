import { useEffect, useState, useRef } from "react";
import "./SongQueueBar.scss";
import globalEvent from "../../cores/global_event";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";

export default function SongQueueBar() {
  const [songs, setSongs] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const animationRef = useRef<number>();
  const midiPlayer = MainMidiPlayer.getInstance();

  // Format seconds to MM:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateTime = () => {
    const processor = midiPlayer?.getProcessor();
    if (processor) {
      setCurrentTime(processor.getCurrentPlaybackTime());
    }
    animationRef.current = requestAnimationFrame(updateTime);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onSongAdded(event: any) {
      setSongs(() =>
        Array.isArray(event.queueSongs) ? [...event.queueSongs] : []
      );
    }

    function onQueueClear() {
      setSongs([]);
    }

    globalEvent.on("song_queue_added", onSongAdded);
    globalEvent.on("song_queue_clear", onQueueClear);

    return () => {
      globalEvent.off("song_queue_added", onSongAdded);
      globalEvent.off("song_queue_clear", onQueueClear);
    };
  }, []);

  return (
    <div className="song-queue-bar">
      <div className="content" style={{ display: songs.length === 0 ? "none" : "block" }}>
        <div className="container">
          <div className="queue-list">
            {songs.map((song, index) => (
              <div className="queue-item" key={index}>
                {song.number}
              </div>
            ))}
          </div>
        </div>
        <p className="current-song">
          Current song: {songs.length > 0 ? `${songs[0].title} (${formatTime(currentTime)})` : "None"}
        </p>
      </div>
    </div>
  );
}