import "./MidiPlayer.scss";
import SongSelector from "./SongSelector";
import bg2 from "../../assets/backgrounds/bg2.mp4";
export default function MidiPlayer() {

  return (
    <div className="midi-player">
      <div className="bg">
        <video src={bg2} autoPlay loop muted playsInline />
      </div>
      <div className="content">
        <div></div>
        <div>
          <SongSelector />
        </div>
        <div></div>
      </div>
    </div>
  );
}
