<template>
  <div v-if="isVisible" class="player-song-selector">
    <p class="label">{{ $t('player.select_song') }}</p>
    <p class="number">{{ digits.join('') }}</p>
    <p v-if="title" class="title">{{ title }}</p>
  </div>
</template>

<script setup lang="ts">
import './PlayerSongSelector.scss'
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Player } from 'src/cores/player/init'
import globalEvent from 'src/cores/global_events'

const player = Player.instance()
const digits = ref(Array(6).fill('0'))
const title = ref('')
const isVisible = ref(true)

watch(digits, (newDigits) => {
  const song = player.getSongByNumber(newDigits.join(''))
  title.value = song ? song.getTitle() : ''
}, { deep: true })

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key >= '0' && e.key <= '9') {
    isVisible.value = true

    digits.value = [...digits.value.slice(1), e.key]
  }

  if (e.key == 'Enter') {
    const currentNumber = digits.value.join('')

    player.addSongByNumber(currentNumber)

    if (
      player.getPlayingSong() == null &&
      player.getQueueSongs().length == 1
    ) {
      player.playSongInQueue()
    }
    digits.value = Array(6).fill('0')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)

  const onSongPlayed = () => {
    isVisible.value = false
  }

  const onSongStopped = () => {
    isVisible.value = true
  }

  globalEvent.on('song_played', onSongPlayed)
  globalEvent.on('song_stopped', onSongStopped)

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
    globalEvent.off('song_played', onSongPlayed)
    globalEvent.off('song_stopped', onSongStopped)
  })
})
</script>
