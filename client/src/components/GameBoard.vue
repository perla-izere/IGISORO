<template>
  <div class="board-container">
    <div class="board">
      <div v-for="(row, rIdx) in store.board" :key="rIdx" class="board-row" :class="rowClass(rIdx)">
        <div class="row-label">{{ rowLabel(rIdx) }}</div>
        <div
          v-for="(seeds, cIdx) in row"
          :key="cIdx"
          class="pit"
          :class="pitClass(rIdx, cIdx, seeds)"
          @click="handleClick(rIdx, cIdx)"
        >
          <div class="pit-inner">
            <div class="seeds-display">
              <span v-if="seeds > 0" class="seed-count-num">{{ seeds }}</span>
              <div v-if="seeds > 0" class="seed-dots">
                <span
                  v-for="i in Math.min(seeds, 12)"
                  :key="i"
                  class="seed-dot"
                  :style="seedStyle(i, Math.min(seeds, 12))"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="row-label">{{ rowLabel(rIdx) }}</div>
      </div>
    </div>
    <div class="col-numbers">
      <div class="col-spacer"/>
      <div v-for="i in 8" :key="i" class="col-num">{{ i }}</div>
      <div class="col-spacer"/>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/game';

const store = useGameStore();

function rowLabel(rIdx) {
  const labels = ['P2 Back', 'P2 Front', 'P1 Front', 'P1 Back'];
  return labels[rIdx];
}

function rowClass(rIdx) {
  return {
    'p2-row': rIdx < 2,
    'p1-row': rIdx >= 2,
    'back-row': rIdx === 0 || rIdx === 3,
    'front-row': rIdx === 1 || rIdx === 2,
  };
}

function pitClass(row, col, seeds) {
  const player = store.currentPlayer;
  const isMyPit = store.playerRows(player).includes(row);
  const isLast = store.lastSownPit?.row === row && store.lastSownPit?.col === col;
  const isCapturePit = store.captureData?.oppPits?.some(p => p.row === row && p.col === col);
  const isRetreatPit = store.awaitingPassResponse &&
    ((store.currentPlayer === 1 && row === 1) || (store.currentPlayer === 2 && row === 2));

  return {
    'pit-mine': isMyPit && !store.gameOver,
    'pit-clickable': isMyPit && seeds > 1 && !store.animating && !store.captureAvailable && !store.awaitingPassResponse && !store.gameOver,
    'pit-last': isLast,
    'pit-capture': isCapturePit,
    'pit-retreat': isRetreatPit && seeds > 0,
    'pit-empty': seeds === 0,
    'pit-p1': row >= 2,
    'pit-p2': row < 2,
  };
}

function handleClick(row, col) {
  if (store.gameOver) return;

  if (store.awaitingPassResponse) {
    store.doRetreat(row, col);
    return;
  }

  if (store.captureAvailable) return;

  if (!store.animating) {
    store.makeMove(row, col);
  }
}

function seedStyle(i, total) {
  const angle = (i / total) * 2 * Math.PI;
  const r = total > 4 ? 38 : 28;
  const x = 50 + r * Math.cos(angle);
  const y = 50 + r * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
}
</script>
