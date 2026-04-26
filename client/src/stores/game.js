import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Board layout:
// Player 2 (opponent): rows 0 (back) and 1 (front)
// Player 1 (human):    rows 2 (front) and 3 (back)
// Each row has 8 pits indexed 0-7
// Pit address: [row][col]

export const useGameStore = defineStore('game', () => {
  const board = ref([]);
  const currentPlayer = ref(1);
  const gameMode = ref('2p'); // '2p' or 'ai'
  const gameOver = ref(false);
  const winner = ref(null);
  const message = ref('');
  const lastSownPit = ref(null);
  const highlightedPits = ref([]);
  const captureAvailable = ref(false);
  const captureData = ref(null);
  const awaitingPassResponse = ref(false);
  const animating = ref(false);
  const moveHistory = ref([]);

  function initBoard() {
    const b = Array.from({ length: 4 }, () => Array(8).fill(0));
    for (let c = 0; c < 8; c++) {
      b[0][c] = 4; // P2 back row
      b[3][c] = 4; // P1 back row
    }
    board.value = b;
    currentPlayer.value = 1;
    gameOver.value = false;
    winner.value = null;
    message.value = "Player 1's turn";
    lastSownPit.value = null;
    highlightedPits.value = [];
    captureAvailable.value = false;
    captureData.value = null;
    awaitingPassResponse.value = false;
    animating.value = false;
    moveHistory.value = [];
  }

  function setMode(mode) {
    gameMode.value = mode;
  }

  // Player 1 owns rows 2 and 3, Player 2 owns rows 0 and 1
  function playerRows(player) {
    return player === 1 ? [2, 3] : [0, 1];
  }

  function isValidPit(player, row, col) {
    const rows = playerRows(player);
    if (!rows.includes(row)) return false;
    if (board.value[row][col] <= 1) return false;
    return true;
  }

  function getValidPits(player) {
    const valid = [];
    for (const r of playerRows(player)) {
      for (let c = 0; c < 8; c++) {
        if (board.value[r][c] > 1) valid.push({ row: r, col: c });
      }
    }
    return valid;
  }

  function hasLegalMoves(player) {
    return getValidPits(player).length > 0;
  }

  // Counterclockwise sowing within player's territory
  // P1 territory: rows 2 (front) and 3 (back)
  // CCW for P1: row3 goes right (0->7), row2 goes left (7->0)
  // P2 territory: rows 0 (back) and 1 (front)
  // CCW for P2: row0 goes left (7->0) wait — actually:
  // Standard Igisoro CCW: think of the 2 rows as a loop
  // P1: back row left-to-right, front row right-to-left
  // P2: back row right-to-left, front row left-to-right
  function nextPit(player, row, col, clockwise = false) {
    if (player === 1) {
      if (!clockwise) {
        // CCW: row3 left(col-1), wrap to row2 at col0 -> row2 right(col+1) wrap to row3
        if (row === 3) {
          if (col > 0) return { row: 3, col: col - 1 };
          else return { row: 2, col: 0 };
        } else {
          if (col < 7) return { row: 2, col: col + 1 };
          else return { row: 3, col: 7 };
        }
      } else {
        // CW: opposite
        if (row === 3) {
          if (col < 7) return { row: 3, col: col + 1 };
          else return { row: 2, col: 7 };
        } else {
          if (col > 0) return { row: 2, col: col - 1 };
          else return { row: 3, col: 0 };
        }
      }
    } else {
      if (!clockwise) {
        // CCW for P2: row0 right(col+1), wrap to row1 at col7 -> row1 left(col-1)
        if (row === 0) {
          if (col < 7) return { row: 0, col: col + 1 };
          else return { row: 1, col: 7 };
        } else {
          if (col > 0) return { row: 1, col: col - 1 };
          else return { row: 0, col: 0 };
        }
      } else {
        if (row === 0) {
          if (col > 0) return { row: 0, col: col - 1 };
          else return { row: 1, col: 0 };
        } else {
          if (col < 7) return { row: 1, col: col + 1 };
          else return { row: 0, col: 7 };
        }
      }
    }
  }

  // Get opponent pits directly opposite a given player pit
  function getOpponentOppositePits(player, row, col) {
    // "directly opposite" = same column, opponent's two rows
    const oppRows = player === 1 ? [0, 1] : [2, 3];
    return oppRows.map(r => ({ row: r, col }));
  }

  function canCapture(player, row, col) {
    const oppPits = getOpponentOppositePits(player, row, col);
    return oppPits.every(p => board.value[p.row][p.col] > 0);
  }

  async function sowSeeds(player, startRow, startCol, clockwise = false, isCaptureSow = false) {
    const b = board.value.map(r => [...r]);
    let seeds = b[startRow][startCol];
    b[startRow][startCol] = 0;
    board.value = b;

    let cur = { row: startRow, col: startCol };

    while (seeds > 0) {
      cur = nextPit(player, cur.row, cur.col, clockwise);
      board.value[cur.row][cur.col]++;
      seeds--;
      lastSownPit.value = { ...cur };
      await delay(120);
    }

    return cur;
  }

  async function makeMove(row, col, clockwise = false) {
    if (animating.value || gameOver.value) return;
    if (!isValidPit(currentPlayer.value, row, col)) return;
    if (captureAvailable.value) return;

    animating.value = true;
    message.value = '';

    let lastPit = await sowSeeds(currentPlayer.value, row, col, clockwise);

    await runRelay(currentPlayer.value, lastPit, row, col, clockwise);
  }

  async function runRelay(player, lastPit, originRow, originCol, clockwise) {
    const pitSeeds = board.value[lastPit.row][lastPit.col];

    if (pitSeeds > 1) {
      // Check capture condition
      if (canCapture(player, lastPit.row, lastPit.col)) {
        const oppPits = getOpponentOppositePits(player, lastPit.row, lastPit.col);
        captureAvailable.value = true;
        captureData.value = {
          player, lastPit, originRow, originCol, clockwise, oppPits,
        };
        message.value = `Player ${player}: Capture available! Click "Capture" or "Pass"`;
        animating.value = false;
        return;
      }

      // Relay: pick up and continue
      const seeds = board.value[lastPit.row][lastPit.col];
      board.value[lastPit.row][lastPit.col] = 0;
      await delay(80);
      let newLast = await sowFrom(player, lastPit, seeds, clockwise);
      await runRelay(player, newLast, originRow, originCol, clockwise);
    } else {
      // Turn ends
      endTurn(player);
    }
  }

  async function sowFrom(player, startPit, seeds, clockwise) {
    let cur = startPit;
    while (seeds > 0) {
      cur = nextPit(player, cur.row, cur.col, clockwise);
      board.value[cur.row][cur.col]++;
      seeds--;
      lastSownPit.value = { ...cur };
      await delay(120);
    }
    return cur;
  }

  async function doCapture() {
    if (!captureAvailable.value || !captureData.value) return;
    animating.value = true;
    const { player, oppPits, originRow, originCol, clockwise } = captureData.value;

    let capturedSeeds = 0;
    for (const p of oppPits) {
      capturedSeeds += board.value[p.row][p.col];
      board.value[p.row][p.col] = 0;
    }

    captureAvailable.value = false;
    captureData.value = null;

    // Sow captured seeds starting from origin pit
    const startPit = { row: originRow, col: originCol };
    let lastPit = await sowFrom(player, startPit, capturedSeeds, clockwise);
    await runRelay(player, lastPit, originRow, originCol, clockwise);
  }

  function doPass() {
    if (!captureAvailable.value) return;
    const { player } = captureData.value;
    captureAvailable.value = false;
    awaitingPassResponse.value = true;
    const opp = player === 1 ? 2 : 1;
    message.value = `Player ${player} passes (ndahise). Player ${opp}: Retreat? Choose a front-row pit to move back.`;
    captureData.value = null;
    animating.value = false;
  }

  function doRetreat(row, col) {
    if (!awaitingPassResponse.value) return;
    const retreatingPlayer = currentPlayer.value === 1 ? 2 : 1;
    const frontRow = retreatingPlayer === 1 ? 2 : 1;
    const backRow = retreatingPlayer === 1 ? 3 : 0;

    if (row !== frontRow) return;
    if (board.value[row][col] === 0) return;

    board.value[backRow][col] += board.value[row][col];
    board.value[row][col] = 0;
    awaitingPassResponse.value = false;
    endTurn(currentPlayer.value);
  }

  function skipRetreat() {
    awaitingPassResponse.value = false;
    endTurn(currentPlayer.value);
  }

  function endTurn(player) {
    animating.value = false;
    lastSownPit.value = null;
    const next = player === 1 ? 2 : 1;

    if (!hasLegalMoves(next)) {
      gameOver.value = true;
      winner.value = player;
      message.value = `🎉 Player ${player} wins! Player ${next} has no legal moves.`;
      return;
    }

    currentPlayer.value = next;
    message.value = `Player ${next}'s turn`;

    if (gameMode.value === 'ai' && next === 2) {
      setTimeout(() => aiMove(), 600);
    }
  }

  function aiMove() {
    if (gameOver.value) return;
    const valid = getValidPits(2);
    if (!valid.length) return;

    // Simple AI: pick the pit with the most seeds
    const best = valid.reduce((a, b) =>
      board.value[b.row][b.col] > board.value[a.row][a.col] ? b : a
    );
    makeMove(best.row, best.col, false);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const p1Seeds = computed(() =>
    playerRows(1).reduce((sum, r) =>
      sum + board.value[r]?.reduce((s, v) => s + v, 0), 0)
  );

  const p2Seeds = computed(() =>
    playerRows(2).reduce((sum, r) =>
      sum + board.value[r]?.reduce((s, v) => s + v, 0), 0)
  );

  return {
    board, currentPlayer, gameMode, gameOver, winner, message,
    lastSownPit, highlightedPits, captureAvailable, captureData,
    awaitingPassResponse, animating, p1Seeds, p2Seeds,
    initBoard, setMode, makeMove, doCapture, doPass, doRetreat, skipRetreat,
    isValidPit, getValidPits, playerRows, canCapture,
  };
});
