import { Button } from "@mui/material";
import bg from "../../assets/bg.mp4";
import "./TitlePage.scss";
import { getCurrentWindow } from '@tauri-apps/api/window';

export default function TitlePage() {

  function quitApp() {
    getCurrentWindow().close()
      .then(() => console.log("Window closed"))
      .catch((error) => console.error("Error closing window:", error));
  }

  return (
    <div className="title-page">
      <div className="background">
        <video src={bg} autoPlay loop muted playsInline />
      </div>
      <div className="content">
        <div className="title-container">
          <h1>Karaoke Player</h1>
        </div>
        <div className='button-container'>
          <Button className="btn-option" variant="contained" href="/player">Play Karaoke</Button>
          <Button className="btn-option" variant="outlined" href="/settings">Edit Songs</Button>
          <Button className="btn-option" variant="outlined" onClick={quitApp}>Quit</Button>
        </div>
        <div className="footer">
          <p>Made with ❤️ by Wicky</p>
        </div>
      </div>
    </div>
  );
}
