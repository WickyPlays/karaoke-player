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

    <p v-if="countdownValue !== null" class="cooldown-time">{{ countdownValue }}</p>

    <div v-if="!inCooldown" class="lyric-container">
      <div class="lyric-top lyric-line">
        <template v-for="(node, index) in topLine" :key="`top-${index}-${node.time}`">
          <p class="lyric-letter" :class="{ whitespace: node.text === ' ' }" :style="{
            backgroundImage: `linear-gradient(90deg, #ff2828 ${getFillPercentage(topLine, index)}%, #ffffff ${getFillPercentage(topLine, index)}%)`,
            fontFamily: lyricFontStyle
          }">
            {{ node.text }}
          </p>
        </template>
      </div>
      <div class="lyric-bottom lyric-line">
        <template v-for="(node, index) in bottomLine" :key="`bottom-${index}-${node.time}`">
          <p class="lyric-letter" :class="{ whitespace: node.text === ' ' }" :style="{
            backgroundImage: `linear-gradient(90deg, #ff2828 ${getFillPercentage(bottomLine, index)}%, #ffffff ${getFillPercentage(bottomLine, index)}%)`,
            fontFamily: lyricFontStyle
          }">
            {{ node.text }}
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
import type { LyricNodeGroup, Song } from 'src/cores/player/obj/song';
import { Store } from 'src/cores/store';

interface LyricNode {
  time: number;
  text: string;
}

interface LyricFrame {
  type:
  | 'title_show'
  | 'title_hide'
  | 'setup'
  | 'countdown'
  | 'lyric_top'
  | 'lyric_bottom'
  | 'cooldown_start'
  | 'cooldown_end';
  time: number;
  lineIndex?: number;
  countdownFrom?: number;
  metadata?: {
    title: string;
    artist?: string;
    charter?: string;
    lyricist?: string;
  };
  available: boolean;
}

export default defineComponent({
  name: 'SongLyricDisplay',
  setup() {
    const { t } = useI18n();
    const midiPlayer = Player.instance();
    const animationFrameRef = ref<number>(0);
    const currTimeRef = ref<number>(0);
    const framesRef = ref<LyricFrame[]>([]);
    const lyricGroupsRef = ref<LyricNodeGroup[]>([]);
    const titleVisibleRef = ref<boolean>(false);
    const processedFramesRef = ref<Set<number>>(new Set());

    const playingSong = ref<Song | null>(null);
    const countdownValue = ref<number | null>(null);
    const topLine = ref<LyricNodeGroup>([]);
    const bottomLine = ref<LyricNodeGroup>([]);
    const showTitle = ref<boolean>(false);
    const inCooldown = ref<boolean>(false);
    const currentTime = ref<number>(0);

    const lyricFontStyle = ref<string>(Store.getStore('settings.lyrics.font') as string || 'Arial, sans-serif');

    const getFillPercentage = (group: LyricNodeGroup, index: number): number => {
      if (!group || index >= group.length) return 0;

      const node = group[index];
      if (!node) return 0;

      const nextNode = group[index + 1];
      const isLastNode = index === group.length - 1;
      let fillPercentage = 0;

      if (currentTime.value >= node.time) {
        if (isLastNode) {
          fillPercentage = 100;
        } else if (nextNode && currentTime.value >= nextNode.time) {
          fillPercentage = 100;
        } else if (nextNode) {
          const timeDiff = nextNode.time - node.time;
          const elapsed = currentTime.value - node.time;
          fillPercentage = Math.min((elapsed / timeDiff) * 100, 100);
        }
      }

      return fillPercentage;
    };

    const updateLyrics = () => {
      const newTime = midiPlayer.getProcessor()?.getCurrentPlaybackTime() || 0;
      currTimeRef.value = newTime;
      currentTime.value = newTime;
      const frames = framesRef.value;
      const lyricGroups = lyricGroupsRef.value;

      if (!frames || frames.length === 0 || lyricGroups.length === 0) {
        animationFrameRef.value = requestAnimationFrame(updateLyrics);
        return;
      }

      frames.forEach((frame, index) => {
        if (
          newTime >= frame.time &&
          frame.available &&
          !processedFramesRef.value.has(index)
        ) {
          processedFramesRef.value.add(index);

          if (frame.type === 'title_show') {
            showTitle.value = true;
            titleVisibleRef.value = true;
          } else if (frame.type === 'title_hide') {
            showTitle.value = false;
            titleVisibleRef.value = false;
          }

          if (frame.type === 'countdown') {
            countdownValue.value =
              frame.countdownFrom && frame.countdownFrom > 0
                ? frame.countdownFrom
                : null;
          }

          if (frame.type === 'lyric_top') {
            if (frame.lineIndex !== undefined && lyricGroups[frame.lineIndex]) {
              topLine.value = lyricGroups[frame.lineIndex];
            } else {
              topLine.value = [];
            }
          }

          if (frame.type === 'lyric_bottom') {
            if (frame.lineIndex !== undefined && lyricGroups[frame.lineIndex]) {
              bottomLine.value = lyricGroups[frame.lineIndex];
            } else {
              bottomLine.value = [];
            }
          }

          if (frame.type === 'cooldown_start') {
            inCooldown.value = true;
          } else if (frame.type === 'cooldown_end') {
            inCooldown.value = false;
          }

          framesRef.value = frames.map((f, i) =>
            i === index ? { ...f, available: false } : f
          );
        }
      });

      animationFrameRef.value = requestAnimationFrame(updateLyrics);
    };

    const createLyricFrames = (song: Song): LyricFrame[] => {
      const frames: LyricFrame[] = [];
      const groups = song.getLyricNodeGroups() || [];
      lyricGroupsRef.value = groups;

      if (groups.length === 0) return frames;

      const firstGroup = groups[0];
      const firstGroupStartTime = firstGroup?.[0]?.time || 0;

      // Add artificial end nodes to each group
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (!group || group.length === 0) continue;

        const secondToLastNode = group[group.length - 2];
        const lastNode = group[group.length - 1];

        if (secondToLastNode && lastNode) {
          const newNode: LyricNode = {
            time: lastNode.time + (lastNode.time - secondToLastNode.time),
            text: '',
          };
          group.push(newNode);
        }
      }

      // Title frames
      if (firstGroupStartTime >= 3) {
        frames.push({
          type: 'title_show',
          time: 0,
          metadata: {
            title: song.getTitle() || 'Unknown title',
            artist: song.getArtist() || 'Unknown artist',
            charter: song.getCharter() || 'Unknown charter',
            lyricist: song.getLyricist() || 'Unknown lyricist',
          },
          available: true,
        });

        frames.push({
          type: 'title_hide',
          time: firstGroupStartTime - 3,
          available: true,
        });
      }

      // Countdown frames
      const countdownableGroups = groups
        .filter((g, i, arr) => {
          if (!g || g.length === 0) return false;
          const lastGroup = arr[i - 1];
          return (
            lastGroup === undefined ||
            (lastGroup.length > 0 &&
              g[0].time - lastGroup[lastGroup[lastGroup.length - 1]?.time || 0] > 6)
          );
        })
        .map((g) => g[0]?.time || 0);

      for (let i = 0; i < countdownableGroups.length; i += 1) {
        for (let j = 3; j >= 0; j -= 1) {
          frames.push({
            type: 'countdown',
            time: countdownableGroups[i] - j,
            countdownFrom: j,
            available: true,
          });
        }
      }

      // Initial lyric frames
      if (groups.length >= 1 && groups[0]) {
        frames.push({
          type: 'lyric_top',
          time: firstGroupStartTime - 3,
          lineIndex: 0,
          available: true,
        });
      }

      if (groups.length >= 2 && groups[1]) {
        frames.push({
          type: 'lyric_bottom',
          time: firstGroupStartTime - 3,
          lineIndex: 1,
          available: true,
        });
      }

      let flipped = false;
      for (let i = 2; i < groups.length; i++) {
        const prevGroup = groups[i - 1];
        const currentGroup = groups[i];

        if (
          !prevGroup ||
          prevGroup.length === 0 ||
          !currentGroup ||
          currentGroup.length === 0
        ) {
          continue;
        }

        const prevGroupEndTime = prevGroup[prevGroup.length - 1]?.time || 0;
        const currentGroupStartTime = currentGroup[0]?.time || 0;
        const timeDiff = currentGroupStartTime - prevGroupEndTime;

        // Handle cooldown between groups
        if (timeDiff > 6) {
          const cooldownStartTime = prevGroupEndTime + 3;
          const cooldownEndTime = currentGroupStartTime - 3;

          frames.push({
            type: 'cooldown_start',
            time: cooldownStartTime,
            available: true,
          });

          frames.push({
            type: 'cooldown_end',
            time: cooldownEndTime,
            available: true,
          });

          // After cooldown, reset the flip state and add both lines
          frames.push({
            type: 'lyric_top',
            time: cooldownEndTime,
            lineIndex: i,
            available: true,
          });

          if (i + 1 < groups.length && groups[i + 1]) {
            frames.push({
              type: 'lyric_bottom',
              time: cooldownEndTime,
              lineIndex: i + 1,
              available: true,
            });
            i++;
          }
          flipped = false;
        } else {
          const transitionTime =
            (prevGroup[0]?.time || 0) +
            ((prevGroup[prevGroup.length - 1]?.time || 0) - (prevGroup[0]?.time || 0)) / 2;

          if (!flipped) {
            frames.push({
              type: 'lyric_top',
              time: transitionTime,
              lineIndex: i,
              available: true,
            });
          } else {
            frames.push({
              type: 'lyric_bottom',
              time: transitionTime,
              lineIndex: i,
              available: true,
            });
          }
          flipped = !flipped;
        }
      }

      const sortedFrames = frames.sort((a, b) => a.time - b.time);
      return sortedFrames;
    };

    const initializeSong = (song: Song) => {
      const frames = createLyricFrames(song);
      framesRef.value = frames;
      processedFramesRef.value = new Set();

      playingSong.value = song;
      countdownValue.value = null;
      topLine.value = [];
      bottomLine.value = [];
      showTitle.value = false;
      inCooldown.value = false;
      titleVisibleRef.value = false;
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
      titleVisibleRef.value = false;
    };

    onMounted(() => {
      animationFrameRef.value = requestAnimationFrame(updateLyrics);
      globalEvent.on('song_played', handleSongPlay);
      globalEvent.on('song_stopped', handleSongStopped);
    });

    onUnmounted(() => {
      if (animationFrameRef.value) {
        cancelAnimationFrame(animationFrameRef.value);
      }
      globalEvent.off('song_played', handleSongPlay);
      globalEvent.off('song_stopped', handleSongStopped);
    });

    return {
      t,
      playingSong,
      countdownValue,
      topLine,
      bottomLine,
      showTitle,
      inCooldown,
      currentTime,
      lyricFontStyle,
      getFillPercentage
    };
  }
});
</script>
