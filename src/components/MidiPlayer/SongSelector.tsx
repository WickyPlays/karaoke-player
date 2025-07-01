import { useEffect, useState } from "react";
import "./SongSelector.scss";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";

export default function SongSelector() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill("0"));
  const [title, setTitle] = useState<string>("");
  const midiPlayer = MainMidiPlayer.getInstance();

  useEffect(() => {
    const song = midiPlayer.getSongByNumber(digits.join(""));
    if (song) {
      setTitle(song.title);
    } else {
      setTitle("");
    }
  }, [digits]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        setDigits((prev) => {
          let next = [...prev];
          for (let i = 1; i < 6; i++) {
            next[i - 1] = next[i];
          }
          next[5] = e.key;

          return next;
        });
      }

      if (e.key == "Enter") {
        const currentNumber = digits.join("");

        midiPlayer.addSongByNumber(currentNumber);

        console.log(`Added! Now queue size = ${midiPlayer.getQueueSongs().length}`);

        if (midiPlayer.getQueueSongs().length == 1) {
          midiPlayer.playSongInQueue();
        }
        setDigits(Array(6).fill("0"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [digits]);

  return (
    <div className="song-selector">
      <p className="label">Select a Song</p>
      <p className="number">{digits.join("")}</p>
      <p className="title">{title}</p>
    </div>
  );
}
