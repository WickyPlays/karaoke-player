<template>
  <div class="settings-general">
    <div class="setting-section">
      <div class="toggle-row">
        <p class="label">{{ $t('settings.general.homeMusic') }}</p>
        <q-toggle v-model="homeMusicEnabled" color="primary" @update:model-value="handleToggleHomeMusic" />
      </div>
      <q-slider v-if="homeMusicEnabled" v-model="homeMusicVolume" :min="0" :max="1" :step="0.1"
        @update:model-value="handleHomeVolumeChange" color="primary" label-always
        :label-value="Math.round(homeMusicVolume * 100) + '%'" />
    </div>

    <div class="setting-section">
      <div class="toggle-row">
        <p class="label">{{ $t('settings.general.waitingMusic') }}</p>
        <q-toggle v-model="waitingMusicEnabled" color="primary" @update:model-value="handleToggleWaitingMusic" />
      </div>
      <q-slider v-if="waitingMusicEnabled" v-model="waitingMusicVolume" :min="0" :max="1" :step="0.1"
        @update:model-value="handleWaitingVolumeChange" color="primary" label-always
        :label-value="Math.round(waitingMusicVolume * 100) + '%'" />
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { SettingsManager } from 'src/cores/player/managers/settings_manager';

export default {
  name: 'SettingsGeneral',
  setup() {
    const { t } = useI18n({ useScope: 'global' })

    const homeMusicEnabled = ref(SettingsManager.instance().getSettingsHomeMusic() ?? true);
    const waitingMusicEnabled = ref(SettingsManager.instance().getSettingsWaitingMusic() ?? true);
    const homeMusicVolume = ref(SettingsManager.instance().getSettingsHomeMusicVolume() ?? 0.5);
    const waitingMusicVolume = ref(SettingsManager.instance().getSettingsWaitingMusicVolume() ?? 0.5);

    const handleToggleHomeMusic = (enabled: boolean) => {
      homeMusicEnabled.value = enabled;
      SettingsManager.instance().setSettingsHomeMusic(enabled);
    };

    const handleToggleWaitingMusic = (enabled: boolean) => {
      waitingMusicEnabled.value = enabled;
      SettingsManager.instance().setSettingsWaitingMusic(enabled);
    };

    const handleHomeVolumeChange = (volume: number) => {
      homeMusicVolume.value = volume;
      SettingsManager.instance().setSettingsHomeMusicVolume(volume);
    };

    const handleWaitingVolumeChange = (volume: number) => {
      waitingMusicVolume.value = volume;
      SettingsManager.instance().setSettingsWaitingMusicVolume(volume);
    };

    return {
      homeMusicEnabled,
      waitingMusicEnabled,
      homeMusicVolume,
      waitingMusicVolume,
      handleToggleHomeMusic,
      handleToggleWaitingMusic,
      handleHomeVolumeChange,
      handleWaitingVolumeChange,
      t
    };
  }
};
</script>

<style scoped>
.settings-general {
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;

  .q-slider {
    padding: 0 16px;
    box-sizing: border-box;
  }
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  margin: 0;
  font-size: 16px;
}
</style>
