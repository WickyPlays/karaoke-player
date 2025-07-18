<template>
  <div class="player-song-finder">
    <div v-if="open" class="song-finder-backdrop" @click="handleClose"></div>
    <div v-if="open" class="song-finder-dialog">
      <div class="dialog-header">
        <button @click="handleClose" class="btn-close">
          <q-icon name="close" />
        </button>
      </div>
      <div class="dialog-content">
        <div class="search-container">
          <input v-model="searchTerm" placeholder="Search songs..." @keyup.enter="applySearch" class="search-field" />
          <button @click="applySearch" class="btn-search">
            <span class="search-icon">
              <q-icon name="search" />
            </span>
          </button>
        </div>

        <div class="song-table-container">
          <table class="song-table">
            <thead>
              <tr>
                <th v-for="col in columns" :key="col.name" :style="col.style">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(song, index) in paginatedSongs" :key="index">
                <td>{{ song.getNumber() }}</td>
                <td>{{ song.getTitle() }}</td>
                <td>{{ song.getArtist() }}</td>
                <td class="action-cell">
                  <button @click="handleAddToQueue(song)" class="btn-add">
                    <span class="add-icon">+</span>
                  </button>
                </td>
              </tr>
              <tr v-if="paginatedSongs.length === 0">
                <td :colspan="columns.length" class="no-data">
                  No songs found
                  <span v-if="appliedSearchTerm">matching "{{ appliedSearchTerm }}"</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-container">
          <button @click="handlePrevPage" :disabled="currentPage === 1" class="pagination-btn">
            Previous
          </button>
          <span class="pagination-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="handleNextPage" :disabled="currentPage === totalPages || totalPages === 0"
            class="pagination-btn">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Player } from 'src/cores/player/init';
import { Song } from 'src/cores/player/obj/song';
import './PlayerSongFinder.scss'

const emit = defineEmits(['close']);

const open = ref<boolean>(true);
const songs = ref<Song[]>([]);
const searchTerm = ref('');
const appliedSearchTerm = ref('');
const currentPage = ref(1);
const entriesPerPage = 50;
const midiPlayer = Player.instance();

const columns = [
  { name: 'number', label: 'Number', field: 'number', align: 'left', style: 'width: 15%' },
  { name: 'title', label: 'Title', field: 'title', align: 'left', style: 'width: 45%' },
  { name: 'artist', label: 'Artist', field: 'artist', align: 'left', style: 'width: 30%' },
  { name: 'action', label: 'Action', field: '', align: 'center' }
];

onMounted(() => {
  songs.value = midiPlayer.getLoadedSongs();
});

const handleClose = () => {
  open.value = false;
  emit('close');
};

const applySearch = () => {
  appliedSearchTerm.value = searchTerm.value;
  currentPage.value = 1;
};

const handleAddToQueue = (song: Song) => {
  midiPlayer.addSongToQueue(song, true);
};

const filteredSongs = computed(() => {
  if (!appliedSearchTerm.value) return songs.value;

  const normalizedSearch = appliedSearchTerm.value.toLowerCase();
  return songs.value.filter((song: Song) => {
    return (
      (song.getTitleTranslit()?.toLowerCase().includes(normalizedSearch) ||
        song.getTitle().toLowerCase().includes(normalizedSearch) ||
        song.getArtist().toLowerCase().includes(normalizedSearch) ||
        song.getNumber().toLowerCase().includes(normalizedSearch)
      ));
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredSongs.value.length / entriesPerPage);
});

const paginatedSongs = computed(() => {
  const startIndex = (currentPage.value - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  return filteredSongs.value.slice(startIndex, endIndex);
});

const handleNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const handlePrevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};
</script>
