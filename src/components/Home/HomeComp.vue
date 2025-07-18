<template>
  <div class="home-comp">
    <div class="background">
      <video :src="bg" autoplay loop muted playsinline />
    </div>
    <div class="content">
      <div class="title-container">
        <h1>Karaoke Player</h1>
      </div>
      <div class="button-container">
        <q-btn class="btn-option" :label="$t('title.play_songs')" to="/player" />
        <q-btn class="btn-option" :label="$t('title.edit_songs')" to="/editor" />
        <q-btn class="btn-option" :label="$t('title.settings')" to="/settings" />
        <q-btn class="btn-option" :label="$t('title.quit')" @click="quitApp" />
      </div>
      <div class="footer">
        <p>Made with ❤️ by Wicky</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import './HomeComp.scss';
import { defineComponent } from 'vue';
import bg from '../../assets/bg.mp4';
import { useQuasar } from 'quasar';
import { App } from '@capacitor/app';

export default defineComponent({
  name: 'HomeComp',
  setup() {
    const $q = useQuasar()

    const quitApp = () => {
      if ($q.platform.is.electron) {
        window.electronAPI?.quitApp();
      } else if ($q.platform.is.ios || $q.platform.is.android) {
        App.exitApp();
      }
    };

    return {
      bg,
      quitApp
    };
  }
});
</script>
