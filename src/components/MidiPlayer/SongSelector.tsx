import { useEffect, useState } from "react";
import "./SongSelector.scss";

export default function SongSelector() {
  const [digits, setDigits] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        setDigits(prev => {
          let next = [...prev];
          if (next.length < 6) {
            next.unshift(e.key);
          } else {
            next = [e.key, ...next.slice(0, 5)]; // Add new digit at start, keep first 5
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="song-selector">
      <p className="label">Select a Song</p>
      <p className="number">
        {[...Array(6)].map((_, i) => digits[5 - i] || "0").join("")}
      </p>
    </div>
  );
}