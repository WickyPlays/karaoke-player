<template>
  <div class="player-background">
    <video :src="backgroundSrc" autoplay loop muted playsinline />
  </div>
</template>

<script lang="ts">
import defaultBg from '../../assets/bg.mp4';
import './PlayerBackground.scss'
import { onMounted, ref } from 'vue';
import { Player } from 'src/cores/player/init';
import { Capacitor } from "@capacitor/core";

export default {
  name: 'PlayerBackground',
  setup() {

    const backgroundSrc = ref(defaultBg);

    const loadBackgrounds = async() => {
      try {
        const bgPaths = await Player.instance().getBackgroundsItems();
        if (bgPaths.length > 0) {
          const bg = bgPaths[0];
          if (bg) {
            var srcUrl = Capacitor.convertFileSrc(bg);
            backgroundSrc.value = srcUrl
          }
        }

      } catch (error) {
        console.error('Failed to load background files:', error);
      }
    }

    onMounted(() => {
      loadBackgrounds();
    });

    return {
      backgroundSrc
    };
  }
};
</script>
