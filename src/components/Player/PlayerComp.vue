<template>
  <div class="player-comp">
    <div v-if="showLoading" class="loading-container">
      <PlayerLoading />
    </div>
    <div class="content-container" v-if="!showLoading">
      <PlayerBackground />
      <PlayerSongFinder v-if="showSongFinder" @close="closeSongFinder" />
      <div class="content">
        <PlayerSongQueueBar />
        <div>
          <PlayerSongSelector />
        </div>
        <PlayerSongLyrics />
        <div></div>
      </div>

      <ConfirmExit v-if="showExitDialog" @confirm="handleConfirm" @cancel="closeExitDialog" />
    </div>

  </div>
</template>

<script lang="ts">
import { ref, onMounted, onBeforeUnmount, onBeforeMount, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PlayerBackground from './PlayerBackground.vue';
import PlayerSongSelector from './PlayerSongSelector.vue';
import ConfirmExit from '../ConfirmExit/ConfirmExit.vue';
import './PlayerComp.scss'
import PlayerSongQueueBar from './PlayerSongQueueBar.vue';
import { Player } from 'src/cores/player/init';
import PlayerSongFinder from './PlayerSongFinder.vue';
import PlayerSongLyrics from './PlayerSongLyrics.vue';
import PlayerLoading from './PlayerLoading.vue';
import globalEvent from 'src/cores/global_events';
import { AudioManager } from 'src/cores/player/managers/audio_manager';

export default {
  name: 'PlayerComp',
  components: {
    PlayerBackground,
    PlayerSongQueueBar,
    PlayerSongSelector,
    PlayerSongFinder,
    PlayerSongLyrics,
    PlayerLoading,
    ConfirmExit
  },
  setup() {
    const router = useRouter();
    const showExitDialog = ref(false);
    const showLoading = ref(false);
    const showSongFinder = ref(false);

    const openExitDialog = () => {
      showExitDialog.value = true;
    };

    const closeExitDialog = () => {
      showExitDialog.value = false;
    };

    const openSongFinder = () => {
      showSongFinder.value = true;
    };

    const closeSongFinder = () => {
      showSongFinder.value = false;
    };

    const handleConfirm = () => {
      Player.instance().cleanup();
      router.push({ path: '/' })
    };

    const handleLoadStart = () => {
      showLoading.value = true
    };

    const handleLoadEnd = () => {
      showLoading.value = false
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!showExitDialog.value) {
          openExitDialog();
        } else {
          closeExitDialog();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!showSongFinder.value) {
          openSongFinder();
        }
      } else if (e.key === 'x' || e.key === 'X') {
        const speed = Player.instance().getProcessor()?.getSpeed();
        Player.instance().getProcessor()?.setSpeed(speed == 1 ? 3 : 1);
      } else if (e.key === 'n' || e.key === 'N') {
        Player.instance().nextSong();
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
      globalEvent.on('player_load_start', (e) => handleLoadStart());
      globalEvent.on('player_load_end', (e) => handleLoadEnd());
      Player.instance().setup();
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      globalEvent.off('player_load_start', (e) => handleLoadStart());
      globalEvent.off('player_load_end', (e) => handleLoadEnd());

      AudioManager.instance().stopAllMusic();
      Player.instance().cleanup();
    });

    return {
      showLoading,
      showExitDialog,
      showSongFinder,
      openExitDialog,
      closeExitDialog,
      closeSongFinder,
      handleConfirm
    };
  }
}
</script>
