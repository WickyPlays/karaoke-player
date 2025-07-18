<template>
  <div class="confirm-exit-overlay">
    <div class="confirm-exit">
      <div class="confirm-exit-content">
        <p class="subtitle">{{ $t('quit_dialog.title') }}</p>
        <div class="confirm-exit-buttons">
          <button class="btn-option" @click="$emit('confirm')">
            {{ $t('quit_dialog.back_to_menu') }}
          </button>
          <button class="btn-option" @click="$emit('cancel')">
            {{ $t('quit_dialog.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import './ConfirmExit.scss';
</script>
