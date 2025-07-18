<template>
  <div class="settings-lyrics">
    <p class="label">Font style</p>
    <q-select
      v-model="selectedFont"
      :options="fontOptions"
      option-value="value"
      option-label="label"
      outlined
      class="font-selector"
      @update:model-value="handleChangeFont"
    />
  </div>
</template>

<script lang="ts">
import { Store } from 'src/cores/store';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
  name: 'SettingsLyrics',
  setup() {
    const { t } = useI18n({ useScope: 'global' })

    const fontOptions = [
      { label: 'Arial', value: 'Arial, sans-serif' },
      { label: 'Times New Roman', value: '"Times New Roman", serif' },
      { label: 'Courier New', value: '"Courier New", monospace' },
      { label: 'Verdana', value: 'Verdana, sans-serif' },
      { label: 'Georgia', value: 'Georgia, serif' },
      { label: 'Helvetica', value: 'Helvetica, sans-serif' },
      { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
      { label: 'Impact', value: 'Impact, sans-serif' },
    ];

    const savedFont = Store.getStore('settings.lyrics.font') || fontOptions[0]?.value;
    const selectedFont = ref(fontOptions.find((option) => option.value === savedFont) || fontOptions[0]);

    const handleChangeFont = (newFont: { label: string; value: string }) => {
      console.log("New font selected: ", newFont);
      selectedFont.value = newFont;
      Store.setStore('settings.lyrics.font', newFont.value);
    };

    return {
      selectedFont,
      fontOptions,
      handleChangeFont,
      t
    };
  }
};
</script>
