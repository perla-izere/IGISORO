<template>
  <div class="game-view">
    <div class="game-top">
      <div class="player-info" :class="{ active: store.currentPlayer === 2 && !store.gameOver }">
        <span class="player-label">{{ store.gameMode === 'ai' ? 'Computer' : 'Player 2' }}</span>
        <span class="seed-count">{{ store.p2Seeds }} seeds</span>
      </div>
      <div class="game-controls">
        <button class="btn-ghost" @click="store.initBoard()">Restart</button>
        <router-link to="/" class="btn-ghost">Menu</router-link>
      </div>
      <div class="player-info right" :class="{ active: store.currentPlayer === 1 && !store.gameOver }">
        <span class="player-label">Player 1</span>
        <span class="seed-count">{{ store.p1Seeds }} seeds</span>
      </div>
    </div>

    <div class="message-bar" :class="{ capture: store.captureAvailable, win: store.gameOver }">
      {{ store.message || 'Choose a pit to sow' }}
    </div>

    <div v-if="!store.board.length" class="no-board">
      <button class="btn-primary" @click="store.initBoard()">Initialize Board</button>
    </div>

    <GameBoard v-else />

    <div class="action-bar" v-if="store.captureAvailable">
      <button class="btn-capture" @click="store.doCapture()">⚔️ Capture!</button>
      <button class="btn-pass" @click="store.doPass()">🤝 Pass (ndahise)</button>
    </div>

    <div class="action-bar" v-if="store.awaitingPassResponse">
      <p class="retreat-hint">Click a front-row pit to retreat it, or skip:</p>
      <button class="btn-ghost" @click="store.skipRetreat()">Skip Retreat</button>
    </div>

    <div v-if="store.gameOver" class="win-overlay">
      <div class="win-card">
        <div class="win-trophy">🏆</div>
        <h2>{{ store.gameMode === 'ai' && store.winner === 2 ? 'Computer Wins!' : `Player ${store.winner} Wins!` }}</h2>
        <p>The opponent had no legal moves remaining.</p>
        <div class="win-actions">
          <button class="btn-primary" @click="store.initBoard()">Play Again</button>
          <router-link to="/" class="btn-ghost">Menu</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGameStore } from '../stores/game';
import GameBoard from '../components/GameBoard.vue';

const store = useGameStore();

onMounted(() => {
  if (!store.board.length) store.initBoard();
});
</script>
