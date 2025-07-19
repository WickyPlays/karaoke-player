<template>
  <div class="settings-comp">
    <div class="background">
      <video :src="bg" autoplay loop muted playsinline />
    </div>

    <div class="settings-dialog">
      <div class="dialog-header">
        <q-btn flat round dense icon="arrow_back" class="back-button" @click="handleBack" />
        <h2 class="dialog-title">{{ $t('settings.title') }}</h2>
      </div>

      <div class="dialog-content">
        <q-tabs v-model="activeTab" vertical class="settings-tabs" active-color="white" indicator-color="white">
          <q-tab name="general" :label="$t('settings.general.tab')" class="settings-tab" />
          <q-tab name="locales" :label="$t('settings.locales')" class="settings-tab" />
          <q-tab name="lyrics" :label="$t('settings.lyrics.tab')" class="settings-tab" />
          <q-tab name="directories" :label="$t('settings.directories.tab')" class="settings-tab" />
        </q-tabs>

        <div class="settings-panel">
          <q-tab-panels v-model="activeTab" animated>
            <q-tab-panel name="general">
              <SettingsGeneral />
            </q-tab-panel>

            <q-tab-panel name="locales">
              <SettingsLanguages />
            </q-tab-panel>

            <q-tab-panel name="lyrics">
              <SettingsLyrics />
            </q-tab-panel>

            <q-tab-panel name="directories">
              <SettingsDirectories />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import './SettingsComp.scss';
import bg from "../../assets/bg.mp4";
import SettingsDirectories from "../../components/Settings/SettingsDirectories.vue";
import SettingsLanguages from "../Settings/SettingsLanguages.vue"
import SettingsLyrics from "../../components/Settings/SettingsLyrics.vue";
import SettingsGeneral from './SettingsGeneral.vue';

export default {
  name: 'SettingsPage',
  components: {
    SettingsGeneral,
    SettingsDirectories,
    SettingsLanguages,
    SettingsLyrics
  },
  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const activeTab = ref('general');

    const handleBack = () => {
      router.push('/').catch(() => { });
    };

    return {
      bg,
      activeTab,
      handleBack,
      t
    };
  }
};
</script>
