import "./MidiPlayer.scss";
import SongSelector from "./SongSelector";
import bg2 from "../../assets/backgrounds/bg2.mp4";
import { useEffect } from "react";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";
import SongQueueBar from "./SongQueueBar";

export default function MidiPlayer() {
  const midiPlayer = MainMidiPlayer.getInstance();

  useEffect(() => {
    const loadDefaultData = async () => {
      midiPlayer.loadAllSongs();
    };
    loadDefaultData();
  }, []);

  return (
    <div className="midi-player">
      <div className="bg">
        <video src={bg2} autoPlay loop muted playsInline />
      </div>
      <div className="content">
        <div>
          <SongQueueBar />
        </div>
        <div>
          <SongSelector />
        </div>
        <div></div>
      </div>
    </div>
  );
}
