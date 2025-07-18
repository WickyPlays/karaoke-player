<template>
  <div class="settings-languages">
    <p class="label">{{ $t('settings.language') }}</p>
    <q-select v-model="selectedLanguage" :options="languageOptions" option-value="value" option-label="label" outlined
      class="language-selector" @update:model-value="handleChangeLanguage" />
  </div>
</template>

<script lang="ts">
import { Store } from 'src/cores/store';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
  name: 'SettingsLanguages',
  setup() {
    const { locale, t } = useI18n({ useScope: 'global' })

    const languageOptions = [
      { label: 'English', value: 'en-US' },
      { label: 'Tiếng Việt', value: 'vi-VN' }
    ];

    const selectedLanguage = ref(languageOptions.find((option) => option.value === locale.value)?.label || "");

    const handleChangeLanguage = (newLanguage: { label: string; value: string }) => {
      console.log("New language: ", newLanguage);
      locale.value = newLanguage.value;
      selectedLanguage.value = newLanguage.label;

      Store.setStore('settings.language.lang', newLanguage.value);
    };

    return {
      selectedLanguage,
      languageOptions,
      handleChangeLanguage,
      t
    };
  }
};
</script>
