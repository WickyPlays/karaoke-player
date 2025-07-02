import { useEffect, useState } from "react";
import "./SongFinder.scss";
import { Song } from "../../cores/songs";
import { MainMidiPlayer } from "../../cores/MidiPlayer/main_midi_player";
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
  TablePagination,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
} from "@mui/icons-material";

export default function SongFinder({ onClose }: { onClose: () => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [open, setOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const midiPlayer = MainMidiPlayer.getInstance();

  useEffect(() => {
    setSongs(midiPlayer.getLoadedSongs());
  }, []);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleAddToQueue = (song: Song) => {
    midiPlayer.addSongToQueue(song, true);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 25));
    setPage(0);
  };

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredSongs.length) : 0;

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

        <TableContainer component={Paper} className="song-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Artist</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSongs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((song) => (
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
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={4} />
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[25, 50, 100]}
            component="div"
            count={filteredSongs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Dialog>
    </Backdrop>
  );
}
