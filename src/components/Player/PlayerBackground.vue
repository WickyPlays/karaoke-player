<template>
  <div class="player-background">
    <video ref="videoRef" :src="backgroundSrc" autoplay loop playsinline muted>
    </video>
  </div>
</template>

<script lang="ts">
import defaultBg from '../../assets/bg.mp4';
import './PlayerBackground.scss'
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { Player } from 'src/cores/player/init';
import globalEvent from 'src/cores/global_events';

export default {
  name: 'PlayerBackground',
  setup() {
    const videoRef = ref<HTMLVideoElement | null>(null);
    const backgroundSrc = ref(defaultBg);

    const loadVideo = async (src: string) => {
      backgroundSrc.value = src;
    };

    const loadBackgrounds = async () => {
      try {
        const bgPaths = await Player.instance().getBackgroundsItems();
        if (bgPaths.length > 0) {
          const bg = bgPaths[0];
          if (bg) {
            await loadVideo(bg);
          }
        }
      } catch (error) {
        console.error('Failed to load background files:', error);
        await loadVideo(defaultBg);
      }
    };

    const loadSongBackground = async (e: any) => {
      try {
        const url = await Player.instance().getCurrentVideoBackground();
        if (url) {
          await loadVideo(url);

          // await loadVideo("https://cdn.pixabay.com/video/2024/08/07/225335_large.mp4");
        } else {
          await loadBackgrounds();
        }
      } catch (error) {
        console.error('Failed to load song background files:', error);
        await loadBackgrounds();
      }
    };

    onMounted(() => {
      loadBackgrounds();
      globalEvent.on('song_played', loadSongBackground);
      // globalEvent.on('player_song_stopped', loadBackgrounds);
    });

    onUnmounted(() => {
      if (videoRef.value) {
        videoRef.value.pause();
      }
      globalEvent.off('song_played', loadSongBackground);
      // globalEvent.off('player_song_stopped', loadBackgrounds);
    });

    return {
      backgroundSrc,
      videoRef
    };
  }
};
</script>
