import { useEffect, useState } from 'react';
import './SongLoadingScreen.scss'
import globalEvent from '../../cores/global_event';

export default function SongLoadingScreen() {
  const [songName, setSongName] = useState('');
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    function onload(e: any) {
      setSongName(e.song.title);
      setLoadedCount(e.loadedCount);
      setTotalCount(e.totalCount);
    }

    globalEvent.on('song_loaded', onload);

    return () => {
      globalEvent.off('song_loaded', onload);
    }
  }, [])

  return (
    <div className="song-loading-screen">
      <p className='loading'>Loading...</p>
      <p className='subtitle'>{songName} ({loadedCount} / {totalCount})</p>
    </div>
  );
}