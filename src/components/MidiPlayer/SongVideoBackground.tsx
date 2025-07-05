import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import "./SongVideoBackground.scss";

interface SongVideoBackgroundProps {
  backgroundFiles: string[];
  currentBgIndex: number;
}

export default function SongVideoBackground({
  backgroundFiles,
  currentBgIndex,
}: SongVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && backgroundFiles.length > 0) {
      const video = videoRef.current;
      const handleLoadedData = () => {
        video.play().catch((e) => console.error("Video play failed:", e));
      };

      video.addEventListener("loadeddata", handleLoadedData);
      video.load();

      return () => {
        video.removeEventListener("loadeddata", handleLoadedData);
      };
    }
  }, [backgroundFiles, currentBgIndex]);

  if (backgroundFiles.length === 0) {
    return null;
  }

  return (
    <div className="song-video-background">
      <video
        ref={videoRef}
        src={backgroundFiles[currentBgIndex]}
        autoPlay
        loop
        muted
        playsInline
        key={backgroundFiles[currentBgIndex]}
      />
    </div>
  );
}