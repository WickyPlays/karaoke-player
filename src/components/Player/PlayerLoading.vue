<template>
  <div class="player-loading">
    <p class="loading">{{ title || "Loading..."}}</p>
    <p class="song-name">{{ subtitle || "Please wait" }}</p>
    <p class="footer">{{ footer || '' }}</p>
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
    const footer = ref('');

    const onload = (e: any) => {
      songName.value = e.song.title;
      title.value = e.title
      subtitle.value = e.subtitle
      footer.value = e.footer
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
      footer
    };
  }
}
</script>
