# ᗑ Igisoro — Traditional Rwandan Strategy Game

Built with Vue 3 + Pinia. Fully implements official Igisoro rules.

## Live URL
[Add your deployed URL here]

## How to Play

1. Each player controls 2 rows (16 pits). Seeds start in the back row only (4 per pit).
2. On your turn, pick a pit with **2 or more seeds** in your territory.
3. Seeds are sown **counterclockwise**, one per pit.
4. If the last seed lands in a **non-empty pit**, pick up all seeds there and continue sowing (relay).
5. If the last seed lands in a pit where **both opponent pits directly opposite are non-empty**, you may **Capture** — taking those seeds and sowing from your origin again.
6. If you choose not to capture, say "Pass" (ndahise). The opponent may then "Retreat" one front-row pit to their back row.
7. For a direct capture move, you may sow **clockwise** instead.
8. You may **not** pick a pit with only 1 seed.
9. The game ends when a player **cannot make any legal move**. That player loses.

## Run Locally

**Terminal 1 — Backend:**
```bash
cd server
json-server --watch db.json --port 3001
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173
