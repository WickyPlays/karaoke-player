import "./App.scss";
import ConfirmExit from "./components/ConfirmExit/ConfirmExit";
import PlayerPage from "./pages/PlayerPage/PlayerPage";
import TitlePage from "./pages/TitlePage/TitlePage";
import { Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadDefaultData } from "./cores/main";

function App() {
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {

    loadDefaultData().then(() => {
      console.log("Default data loaded successfully");
    }).catch((error) => {
      console.error("Error loading default data:", error);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExitConfirm(!showExitConfirm);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="App">
      {showExitConfirm && (
        <ConfirmExit 
          onClose={() => setShowExitConfirm(false)} 
        />
      )}

      <Routes>
        <Route path="/" element={<TitlePage />} />
        <Route path="/player" element={<PlayerPage />} />
      </Routes>
    </div>
  );
}

export default App;