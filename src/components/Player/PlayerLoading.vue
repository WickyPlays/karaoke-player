<template>
  <div class="player-loading">
    <p class="loading">{{ title }}</p>
    <p class="song-name">{{ subtitle }}</p>
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${percentage}%` }"></div>
    </div>
  </div>
</template>

<script lang="ts">
import './PlayerLoading.scss';
import { ref, onMounted, onUnmounted } from 'vue';
import globalEvent from 'src/cores/global_events';

export default {
  name: 'PlayerLoading',
  setup() {
    const songName = ref('');
    const title = ref('');
    const subtitle = ref('');
    const percentage = ref(0);

    const onload = (e: any) => {
      songName.value = e.song.title;
      title.value = e.title
      subtitle.value = e.subtitle
      percentage.value = e.percentage
    };


    onMounted(() => {
      globalEvent.on('player_load_update', onload);
    });

    onUnmounted(() => {
      globalEvent.off('player_load_update', onload);
    });

    return {
      songName,
      title,
      subtitle,
      percentage
    };
  }
}
</script>
