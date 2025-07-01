import "./MidiPlayer.scss";
import SongSelector from "./SongSelector";
import { useEffect, useState, useCallback } from "react";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";
import SongQueueBar from "./SongQueueBar";
import { loadBackgrounds } from "../../cores/main";
import SongLyricDisplay from "./SongLyricDisplay";

export default function MidiPlayer() {
  const midiPlayer = MainMidiPlayer.getInstance();
  const [backgroundFiles, setBackgroundFiles] = useState<string[]>([]);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B") {
        setCurrentBgIndex((prev) => (prev + 1) % backgroundFiles.length);
      } else if (e.key === "p" || e.key === "P") {
        if (isPaused) {
          midiPlayer.getProcessor().resume();
        } else {
          midiPlayer.getProcessor().pause();
        }
        setIsPaused(!isPaused);
      }
    },
    [backgroundFiles.length, isPaused]
  );

  useEffect(() => {
    const initialize = async () => {
      const bgs = await loadBackgrounds();
      await midiPlayer.setup();
      setBackgroundFiles(bgs);
      setIsInitialized(true);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (backgroundFiles.length > 0) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [backgroundFiles.length, handleKeyDown]);

  if (!isInitialized) {
    return <div className="midi-player loading">Loading...</div>;
  }

  return (
    <div className="midi-player">
      {backgroundFiles.length > 0 && (
        <div className="bg">
          <video
            src={backgroundFiles[currentBgIndex]}
            autoPlay
            loop
            muted
            playsInline
            key={backgroundFiles[currentBgIndex]}
          />
        </div>
      )}
      <div className="content">
        <div>
          <SongQueueBar />
        </div>
        <div>
          <SongSelector />
        </div>
        <div>
          <SongLyricDisplay />
        </div>
      </div>
    </div>
  );
}
