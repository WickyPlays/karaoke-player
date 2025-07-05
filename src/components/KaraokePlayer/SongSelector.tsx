import { useEffect, useState } from "react";
import "./SongSelector.scss";
import { MainPlayerCore } from "../../cores/KaraokePlayer/main_player_core";
import globalEvent from "../../cores/global_event";

export default function SongSelector() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill("0"));
  const [title, setTitle] = useState<string>("");
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  const karaokePlayer = MainPlayerCore.getInstance();

  useEffect(() => {
    const song = karaokePlayer.getSongByNumber(digits.join(""));
    if (song) {
      setTitle(song.title);
    } else {
      setTitle("");
    }
  }, [digits]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        setIsVisible(true);
        if (inputTimeout) {
          clearTimeout(inputTimeout);
        }
        
        setDigits((prev) => {
          let next = [...prev];
          for (let i = 1; i < 6; i++) {
            next[i - 1] = next[i];
          }
          next[5] = e.key;
          return next;
        });

        setInputTimeout(setTimeout(() => {
          setIsVisible(false);
        }, 5000));
      }

      if (e.key == "Enter") {
        const currentNumber = digits.join("");

        karaokePlayer.addSongByNumber(currentNumber);

        if (karaokePlayer.getPlayingSong() == null && karaokePlayer.getQueueSongs().length == 1) {
          karaokePlayer.playSongInQueue();
        }
        setDigits(Array(6).fill("0"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
    };
  }, [digits, inputTimeout]);

  useEffect(() => {
    function onSongPlayed() {
      setIsVisible(false);
    }

    function onSongStopped() {
      setIsVisible(true);
    }

    globalEvent.on("song_played", onSongPlayed);
    globalEvent.on("song_stopped", onSongStopped);

    return () => {
      globalEvent.off("song_played", onSongPlayed);
      globalEvent.off("song_stopped", onSongStopped);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="song-selector">
      <p className="label">Select a Song</p>
      <p className="number">{digits.join("")}</p>
      {
        title && (
          <p className="title">{title}</p>
        )
      }
    </div>
  );
}