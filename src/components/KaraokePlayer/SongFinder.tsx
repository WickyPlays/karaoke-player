import { useEffect, useState, useRef } from "react";
import "./SongFinder.scss";
import { Song } from "../../cores/songs";
import { MainPlayerCore } from "../../cores/KaraokePlayer/main_player_core";
import {
  Backdrop,
  Dialog,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
  ButtonGroup,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { formatLatinize } from "../../utils/util_format";

export default function SongFinder({ onClose }: { onClose: () => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [open, setOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const midiPlayer = MainPlayerCore.getInstance();
  const tableRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    setSongs(midiPlayer.getLoadedSongs());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current) return;
      
      const scrollPosition = tableRef.current.scrollTop + 100;
      let active = null;
      
      Object.entries(letterRefs.current).forEach(([letter, element]) => {
        if (element && element.offsetTop <= scrollPosition) {
          active = letter;
        }
      });
      
      setActiveLetter(active);
    };

    const table = tableRef.current;
    if (table) {
      table.addEventListener('scroll', handleScroll);
      return () => table.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAddToQueue = (song: Song) => {
    midiPlayer.addSongToQueue(song, true);
  };

  const scrollToLetter = (letter: string) => {
    const element = letterRefs.current[letter];
    if (element && tableRef.current) {
      tableRef.current.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  const filteredSongs = songs.filter((song) => {
    const normalizedSearch = formatLatinize(searchTerm.toLowerCase());
    return (
      formatLatinize(song.title.toLowerCase()).includes(normalizedSearch) ||
      formatLatinize(song.artist.toLowerCase()).includes(normalizedSearch) ||
      formatLatinize(song.number.toLowerCase()).includes(normalizedSearch)
    );
  });

  const groupedSongs = filteredSongs.reduce((acc, song) => {
    const firstLetter = song.title.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  const letters = Object.keys(groupedSongs).sort();

  return (
    <Backdrop open={open} onClick={handleClose}>
      <Dialog
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        maxWidth="md"
        fullWidth
        className="song-finder-dialog"
      >
        <div className="search-container">
          <TextField
            className="search-field"
            fullWidth
            variant="outlined"
            placeholder="Search songs..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </div>

        <TableContainer component={Paper} className="song-table" ref={tableRef}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {letters.map((letter) => (
                <>
                  <TableRow key={`header-${letter}`} ref={(el) => letterRefs.current[letter] = el}>
                    <TableCell colSpan={4} className="letter-header">
                      {letter}
                    </TableCell>
                  </TableRow>
                  {groupedSongs[letter].map((song) => (
                    <TableRow key={song.number}>
                      <TableCell width="15%">{song.number}</TableCell>
                      <TableCell width="45%">{song.title}</TableCell>
                      <TableCell width="30%">{song.artist}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleAddToQueue(song)}>
                          <AddIcon sx={{ color: "#000000" }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <div className="az-navigation">
          <ButtonGroup variant="contained">
            {letters.map((letter) => (
              <Button
                key={letter}
                onClick={() => scrollToLetter(letter)}
                className={activeLetter === letter ? 'active' : ''}
              >
                {letter}
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </Dialog>
    </Backdrop>
  );
}