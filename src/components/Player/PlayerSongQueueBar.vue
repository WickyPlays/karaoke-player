<template>
  <div class="song-queue-bar">
    <div
      class="content"
      :style="{
        display: !playingSong && songs.length === 0 ? 'none' : 'block',
      }"
    >
      <div class="container">
        <div class="queue-list">
          <div v-if="playingSong" class="queue-item queue-play">
            {{ playingSong.getNumber()}}
          </div>

          <div v-for="(song, index) in songs" :key="index" class="queue-item">
            <p :class="{ 'queue-next': index == 0 }">{{ song.getNumber() }}</p>
          </div>
        </div>
      </div>
      <div class="meta-container">
        <div class="current-song">
          <p v-if="playingSong">
            {{ $t('player.current_song') }}: {{ playingSong.getTitle() }}
            ({{ formatTime(currentTime) }} /
            {{ formatTime(midiPlayer.getDuration() || 0) }})
          </p>
          <p v-else>None</p>
        </div>
        <p v-if="speed > 1" class="speed">{{ speed }}x</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { Player } from "src/cores/player/init";
import './PlayerSongQueueBar.scss'
import globalEvent from "src/cores/global_events";

export default {
  name: "SongQueueBar",
  setup() {
    const playingSong = ref(null);
    const songs = ref([]);
    const currentTime = ref(0);
    const speed = ref(1);
    const animationRef = ref(null);
    const midiPlayer = Player.instance()

    // Format seconds to MM:ss
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    };

    const updateTime = () => {
      const processor = midiPlayer?.getProcessor();
      if (processor) {
        currentTime.value = processor.getCurrentPlaybackTime();
      }
      animationRef.value = requestAnimationFrame(updateTime);
    };

    onMounted(() => {
      const currentSong = midiPlayer?.getPlayingSong();
      if (currentSong) {
        playingSong.value = currentSong;
      }

      animationRef.value = requestAnimationFrame(updateTime);
    });

    onUnmounted(() => {
      if (animationRef.value) {
        cancelAnimationFrame(animationRef.value);
      }
    });

    const onSongAdded = (event) => {
      songs.value = Array.isArray(event.queueSongs) ? [...event.queueSongs] : [];
    };

    const onQueueClear = () => {
      songs.value = [];
    };

    const onSongUpdated = (event) => {
      songs.value = [...event.queueSongs];
    };

    const onSongPlay = (event) => {
      playingSong.value = event.song;
      songs.value = event.queueSongs;
    };

    const onSpeedChanged = (event) => {
      speed.value = event.speed;
    };

    const onSongStopped = (event) => {
      playingSong.value = null;
      songs.value = event.queueSongs || [];
    };

    onMounted(() => {
      globalEvent.on("song_played", onSongPlay);
      globalEvent.on("song_stopped", onSongStopped);
      globalEvent.on("song_queue_added", onSongAdded);
      globalEvent.on("song_queue_clear", onQueueClear);
      globalEvent.on("song_queue_updated", onSongUpdated);
      globalEvent.on("song_speed_changed", onSpeedChanged);
    });

    onUnmounted(() => {
      globalEvent.off("song_played", onSongPlay);
      globalEvent.off("song_stopped", onSongStopped);
      globalEvent.off("song_queue_added", onSongAdded);
      globalEvent.off("song_queue_clear", onQueueClear);
      globalEvent.off("song_queue_updated", onSongUpdated);
      globalEvent.off("song_speed_changed", onSpeedChanged);
    });

    return {
      playingSong,
      songs,
      currentTime,
      speed,
      formatTime,
      midiPlayer,
    };
  },
};
</script>
