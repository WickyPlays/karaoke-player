<template>
  <div class="song-lyric-display">
    <div v-if="showTitle" class="title-container">
      <p class="song-title">{{ playingSong?.getTitle() || $t('player.title.unknown_title') }}</p>
      <p class="song-meta">{{ $t('player.title.artist') }}: {{ playingSong?.getArtist() ||
        $t('player.title.unknown_artist') }}</p>
      <p class="song-meta">{{ $t('player.title.charter') }}: {{ playingSong?.getCharter() ||
        $t('player.title.unknown_charter') }}</p>
      <p class="song-meta">{{ $t('player.title.lyricist') }}: {{ playingSong?.getLyricist() ||
        $t('player.title.unknown_lyricist') }}
      </p>
    </div>

    <div v-if="inCooldown" class="middle-container">
      <p>{{ $t('player.cooldown') }}</p>
    </div>

    <p v-if="countdownValue !== null && countdownValue > 0" class="cooldown-time">{{ countdownValue }}</p>

    <div v-if="!inCooldown" class="lyric-container">
      <div class="lyric-top lyric-line">
        <template v-for="(node, index) in topLine" :key="`top-${index}-${node.s}`">
          <p class="lyric-letter" :class="{ whitespace: node.t === ' ' }" :style="{
            backgroundImage: `linear-gradient(90deg, #ff2828 ${getFillPercentage(topLine, index)}%, #ffffff ${getFillPercentage(topLine, index)}%)`,
            fontFamily: lyricFontStyle
          }">
            {{ node.t }}
          </p>
        </template>
      </div>
      <div class="lyric-bottom lyric-line">
        <template v-for="(node, index) in bottomLine" :key="`bottom-${index}-${node.s}`">
          <p class="lyric-letter" :class="{ whitespace: node.t === ' ' }" :style="{
            backgroundImage: `linear-gradient(90deg, #ff2828 ${getFillPercentage(bottomLine, index)}%, #ffffff ${getFillPercentage(bottomLine, index)}%)`,
            fontFamily: lyricFontStyle
          }">
            {{ node.t }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import './PlayerSongLyrics.scss'
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Player } from 'src/cores/player/init';
import globalEvent from 'src/cores/global_events';
import { LyricFrame, LyricParser } from 'src/cores/player/parsers/lyricParser';
import type { LyricNodeGroup, Song } from 'src/cores/player/obj/song';
import { Store } from 'src/cores/store';

export default defineComponent({
  name: 'SongLyricDisplay',
  setup() {
    const { t } = useI18n();
    const midiPlayer = Player.instance();
    const animationFrameRef = ref<number>(0);
    const currentTime = ref<number>(0);
    const framesRef = ref<LyricFrame[]>([]);
    const lyricGroupsRef = ref<LyricNodeGroup[]>([]);
    const processedFramesRef = ref<Set<number>>(new Set());

    const playingSong = ref<Song | null>(null);
    const countdownValue = ref<number | null>(null);
    const topLine = ref<LyricNodeGroup>([]);
    const bottomLine = ref<LyricNodeGroup>([]);
    const showTitle = ref<boolean>(false);
    const inCooldown = ref<boolean>(false);
    const lyricFontStyle = ref<string>(Store.getStore('settings.lyrics.font') as string || 'Arial, sans-serif');

    const getFillPercentage = (group: LyricNodeGroup, index: number): number => {
      if (!group || index >= group.length) return 0;
      const node = group[index];
      if (!node) return 0;

      if (currentTime.value >= node.e) {
        return 100;
      } else if (currentTime.value >= node.s) {
        const duration = node.e - node.s;
        const elapsed = currentTime.value - node.s;
        return Math.min((elapsed / duration) * 100, 100);
      }
      return 0;
    };

    const updateLyrics = () => {
      const newTime = midiPlayer.getProcessor()?.getCurrentPlaybackTime() || 0;
      currentTime.value = newTime;
      const frames = framesRef.value;
      const lyricGroups = lyricGroupsRef.value;

      if (!frames || frames.length === 0 || lyricGroups.length === 0) {
        animationFrameRef.value = requestAnimationFrame(updateLyrics);
        return;
      }

      frames.forEach((frame, index) => {
        if (newTime >= frame.time && frame.available && !processedFramesRef.value.has(index)) {
          processedFramesRef.value.add(index);

          switch (frame.type) {
            case 'title_show':
              showTitle.value = true;
              break;
            case 'title_hide':
              showTitle.value = false;
              break;
            case 'countdown':
              countdownValue.value = frame.countdownFrom ?? null;
              break;
            case 'lyric_top':
              topLine.value = frame.lineIndex !== undefined ? lyricGroups[frame.lineIndex] ?? [] : [];
              break;
            case 'lyric_bottom':
              bottomLine.value = frame.lineIndex !== undefined ? lyricGroups[frame.lineIndex] ?? [] : [];
              break;
            case 'cooldown_start':
              inCooldown.value = true;
              break;
            case 'cooldown_end':
              inCooldown.value = false;
              break;
          }

          framesRef.value = frames.map((f, i) =>
            i === index ? { ...f, available: false } : f
          );
        }
      });

      animationFrameRef.value = requestAnimationFrame(updateLyrics);
    };

    const initializeSong = async (song: Song) => {
      const { lyricGroups, frames } = Player.instance().getLyricFrames()

      framesRef.value = frames;
      lyricGroupsRef.value = lyricGroups;
      processedFramesRef.value = new Set();

      playingSong.value = song;
      countdownValue.value = null;
      topLine.value = [];
      bottomLine.value = [];
      showTitle.value = false;
      inCooldown.value = false;

      animationFrameRef.value = requestAnimationFrame(updateLyrics);
    };

    const handleSongPlay = (event: { song: Song }) => {
      if (event?.song) {
        initializeSong(event.song);
      }
    };

    const handleSongStopped = () => {
      if (animationFrameRef.value) {
        cancelAnimationFrame(animationFrameRef.value);
      }
      framesRef.value = [];
      lyricGroupsRef.value = [];
      processedFramesRef.value = new Set();
      playingSong.value = null;
      countdownValue.value = null;
      topLine.value = [];
      bottomLine.value = [];
      showTitle.value = false;
      inCooldown.value = false;
    };

    onMounted(() => {
      animationFrameRef.value = requestAnimationFrame(updateLyrics);
      globalEvent.on('song_played', handleSongPlay);
      globalEvent.on('player_song_stopped', handleSongStopped);
    });

    onUnmounted(() => {
      if (animationFrameRef.value) {
        cancelAnimationFrame(animationFrameRef.value);
      }
      globalEvent.off('song_played', handleSongPlay);
      globalEvent.off('player_song_stopped', handleSongStopped);
    });

    return {
      t,
      playingSong,
      countdownValue,
      topLine,
      bottomLine,
      showTitle,
      inCooldown,
      lyricFontStyle,
      getFillPercentage
    };
  }
});
</script>
