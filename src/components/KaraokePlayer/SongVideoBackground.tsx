import "./SongVideoBackground.scss";
import { convertFileSrc } from "@tauri-apps/api/core";

interface SongVideoBackgroundProps {
  backgroundFile: string;
}

export default function SongVideoBackground({
  backgroundFile,
}: SongVideoBackgroundProps) {

  console.log(convertFileSrc(backgroundFile));

  return (
    <div className="song-video-background">
      <video
        src={convertFileSrc(backgroundFile)}
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
}
