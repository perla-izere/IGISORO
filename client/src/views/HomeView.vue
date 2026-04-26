<template>
  <div class="home">
    <div class="home-content">
      <p class="eyebrow">Traditional Rwandan Strategy Game</p>
      <h1 class="hero-title">IGISORO</h1>
      <p class="hero-sub">
        A game of seeds and strategy passed down through generations in Rwanda.
        Sow, capture, and outmaneuver your opponent across a 4×8 board.
      </p>

      <div class="mode-picker">
        <button
          :class="['mode-btn', { active: selected === '2p' }]"
          @click="selected = '2p'"
        >
          <span class="mode-icon">👥</span>
          <span class="mode-label">2 Players</span>
          <span class="mode-desc">Same screen</span>
        </button>
        <button
          :class="['mode-btn', { active: selected === 'ai' }]"
          @click="selected = 'ai'"
        >
          <span class="mode-icon">🤖</span>
          <span class="mode-label">vs Computer</span>
          <span class="mode-desc">Play solo</span>
        </button>
      </div>

      <router-link to="/game" class="play-btn" @click="start">
        Start Game →
      </router-link>

      <div class="rules-preview">
        <h3>Quick Rules</h3>
        <ul>
          <li>Pick a pit with <strong>2+ seeds</strong> from your territory</li>
          <li>Sow seeds <strong>counterclockwise</strong> one per pit</li>
          <li>If last pit isn't empty → <strong>continue sowing</strong> (relay)</li>
          <li>Capture opponent seeds when both opposite pits are non-empty</li>
          <li>Win when opponent <strong>can't move</strong></li>
        </ul>
      </div>
    </div>

    <div class="board-preview">
      <div class="mini-board">
        <div v-for="row in 4" :key="row" class="mini-row">
          <div v-for="col in 8" :key="col" class="mini-pit">
            <span class="mini-seeds">{{ previewSeeds[row-1][col-1] }}</span>
          </div>
        </div>
      </div>
      <p class="board-label">4 × 8 Board · 64 Seeds</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGameStore } from '../stores/game';

const store = useGameStore();
const selected = ref('2p');

const previewSeeds = [
  [4,4,4,4,4,4,4,4],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [4,4,4,4,4,4,4,4],
];

function start() {
  store.setMode(selected.value);
  store.initBoard();
}
</script>
