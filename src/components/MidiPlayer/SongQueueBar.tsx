import { useEffect, useState, useRef } from "react";
import "./SongQueueBar.scss";
import globalEvent from "../../cores/global_event";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";
import { Song } from "../../cores/songs";

export default function SongQueueBar() {
  const [playingSong, setPlayingSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const animationRef = useRef<number>();
  const midiPlayer = MainMidiPlayer.getInstance();

  // Format seconds to MM:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const updateTime = () => {
    const processor = midiPlayer?.getProcessor();
    if (processor) {
      setCurrentTime(processor.getCurrentPlaybackTime());
    }
    animationRef.current = requestAnimationFrame(updateTime);
  };

  useEffect(() => {
    // Initialize with current player state
    const currentSong = midiPlayer?.getPlayingSong();
    if (currentSong) {
      setPlayingSong(currentSong);
    }

    // Start time updates
    animationRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onSongAdded(event: { queueSongs: Song[] }) {
      setSongs(Array.isArray(event.queueSongs) ? [...event.queueSongs] : []);
    }

    function onQueueClear() {
      setSongs([]);
    }

    function onSongUpdated(event: { queueSongs: Song[] }) {
      setSongs([...event.queueSongs]);
    }

    function onSongPlay(event: { song: Song }) {
      setPlayingSong(event.song);
    }

    globalEvent.on("song_play", onSongPlay),
      globalEvent.on("song_queue_added", onSongAdded),
      globalEvent.on("song_queue_clear", onQueueClear),
      globalEvent.on("song_queue_updated", onSongUpdated);

    return () => {
      globalEvent.off("song_play", onSongPlay);
      globalEvent.off("song_queue_added", onSongAdded);
      globalEvent.off("song_queue_clear", onQueueClear);
      globalEvent.off("song_queue_updated", onSongUpdated);
    };
  }, []);

  return (
    <div className="song-queue-bar">
      <div
        className="content"
        style={{
          display: !playingSong && songs.length === 0 ? "none" : "block",
        }}
      >
        <div className="container">
          <div className="queue-list">
            {playingSong && (
              <div className="queue-item queue-play">{playingSong.number}</div>
            )}

            {songs.map((song, index) => (
              <div className="queue-item" key={`${song.id}-${index}`}>
                {song.number}
              </div>
            ))}
          </div>
        </div>
        <p className="current-song">
          Current song:{" "}
          {playingSong
            ? `${playingSong.title} (${formatTime(currentTime)})`
            : "None"}
        </p>
      </div>
    </div>
  );
}
