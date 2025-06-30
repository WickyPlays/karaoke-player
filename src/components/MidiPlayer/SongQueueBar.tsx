import { useEffect, useState } from "react";
import "./SongQueueBar.scss";
import globalEvent from "../../cores/global_event";

export default function SongQueueBar() {
  const [songs, setSongs] = useState([]);

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
      <div className="container">
        <div className="queue-list">
          {songs.map((song, index) => (
            <div className="queue-item" key={index}>{song.number}</div>
          ))}
        </div>
      </div>
      <p className="current-song">Current song: {songs.length > 0 ? songs[0].title : "None"}</p>
    </div>
  );
}
