import { useEffect, useState, useRef } from "react";
import "./SongQueueBar.scss";
import globalEvent from "../../cores/global_event";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";
import { Song } from "../../cores/songs";

export default function SongQueueBar() {
  const [playingSong, setPlayingSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
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
    const currentSong = midiPlayer?.getPlayingSong();
    if (currentSong) {
      setPlayingSong(currentSong);
    }

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

    function onSongPlay(event: { song: Song, queueSongs: Song[] }) {
      setPlayingSong(event.song);
      setSongs(event.queueSongs);
    }

    function onSpeedChanged(event: { speed: number }) {
      setSpeed(event.speed);
    }

    function onSongStopped(event: any) {
      setPlayingSong(null);
      setSongs(event.queueSongs || []);
    }

    globalEvent.on("song_played", onSongPlay);
    globalEvent.on("song_stopped", onSongStopped);
    globalEvent.on("song_queue_added", onSongAdded);
    globalEvent.on("song_queue_clear", onQueueClear);
    globalEvent.on("song_queue_updated", onSongUpdated);
    globalEvent.on("song_speed_changed", onSpeedChanged);

    return () => {
      globalEvent.off("song_played", onSongPlay);
      globalEvent.off("song_stopped", onSongStopped);
      globalEvent.off("song_queue_added", onSongAdded);
      globalEvent.off("song_queue_clear", onQueueClear);
      globalEvent.off("song_queue_updated", onSongUpdated);
      globalEvent.off("song_speed_changed", onSpeedChanged);
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
                <p>{song.number}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="meta-container">
          <div className="current-song">
            {playingSong ? (
              <p>
                Current song: {playingSong.title} ({formatTime(currentTime)} /{" "}
                {formatTime(midiPlayer.getDuration() || 0)})
              </p>
            ) : (
              <p>None</p>
            )}
          </div>
          {speed > 1 && <p className="speed">{speed}x</p>}
        </div>
      </div>
    </div>
  );
}
