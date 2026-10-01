export const WIDTH = 15, HEIGHT = 13, STEP = 1 / 60;
export const index = (x, y) => y * WIDTH + x;
export const tile = p => [Math.floor(p.x), Math.floor(p.y)];
const corners = [[1, 1], [13, 11], [13, 1], [1, 11]];

export function createGame(ids = ['practice'], seed = 1) {
  const board = Array(WIDTH * HEIGHT).fill(0);
  let rng = seed >>> 0;
  const random = () => ((rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const i = index(x, y), opposite = index(WIDTH - 1 - x, HEIGHT - 1 - y);
    if (!x || !y || x === WIDTH - 1 || y === HEIGHT - 1 || (!(x % 2) && !(y % 2))) board[i] = 1;
    else if (i <= opposite && !corners.some(([cx, cy]) => Math.abs(cx - x) + Math.abs(cy - y) <= 2)) {
      board[i] = board[opposite] = random() < .7 ? 2 : 0;
    }
  }
  return { time: 0, tick: 0, board, bombs: [], blasts: [], nextBomb: 1, paused: false,
    players: ids.map((id, n) => ({ id, x: corners[n][0] + .5, y: corners[n][1] + .5, alive: true, capacity: 1, range: 2, speed: 3 })), events: [] };
}

function blocked(g, p, x, y) {
  for (const dx of [-.28, .28]) for (const dy of [-.28, .28]) {
    const tx = Math.floor(x + dx), ty = Math.floor(y + dy);
    if (tx < 0 || ty < 0 || tx >= WIDTH || ty >= HEIGHT || g.board[index(tx, ty)]) return true;
    if (g.bombs.some(b => b.x === tx && b.y === ty && !b.pass.includes(p.id))) return true;
  }
  return false;
}

export function placeBomb(g, p) {
  if (!p?.alive || g.bombs.filter(b => b.owner === p.id).length >= p.capacity) return false;
  const [x, y] = tile(p);
  if (g.board[index(x, y)] || g.bombs.some(b => b.x === x && b.y === y)) return false;
  g.bombs.push({ id: g.nextBomb++, owner: p.id, x, y, range: p.range, deadline: g.tick + 150,
    pass: g.players.filter(q => Math.abs(q.x - x - .5) < .78 && Math.abs(q.y - y - .5) < .78).map(q => q.id) });
  return true;
}

export function stepGame(g, inputs = {}) {
  if (g.paused) return;
  g.tick++; g.time = g.tick * STEP; g.events = [];
  g.blasts = g.blasts.filter(b => b.until > g.tick);
  for (const p of g.players) {
    if (!p.alive) continue;
    const input = inputs[p.id] || {};
    let dx = Math.sign(Number(input.x) || 0), dy = Math.sign(Number(input.y) || 0);
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    const distance = p.speed * STEP;
    // Gentle assistance aligns the perpendicular axis only through free space.
    if (dx && !dy) { const y = p.y + Math.sign(Math.floor(p.y) + .5 - p.y) * Math.min(Math.abs(Math.floor(p.y) + .5 - p.y), distance); if (!blocked(g, p, p.x, y)) p.y = y; }
    if (dy && !dx) { const x = p.x + Math.sign(Math.floor(p.x) + .5 - p.x) * Math.min(Math.abs(Math.floor(p.x) + .5 - p.x), distance); if (!blocked(g, p, x, p.y)) p.x = x; }
    if (!blocked(g, p, p.x + dx * distance, p.y)) p.x += dx * distance;
    if (!blocked(g, p, p.x, p.y + dy * distance)) p.y += dy * distance;
    for (const b of g.bombs) if (Math.abs(p.x - b.x - .5) >= .78 || Math.abs(p.y - b.y - .5) >= .78) b.pass = b.pass.filter(id => id !== p.id);
    if (input.bomb) placeBomb(g, p);
  }
  const queue = g.bombs.filter(b => b.deadline <= g.tick), detonated = new Set(), geometry = [...g.board], destroyed = new Set();
  while (queue.length) {
    const bomb = queue.shift();
    if (detonated.has(bomb.id)) continue;
    detonated.add(bomb.id);
    const cells = [index(bomb.x, bomb.y)];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let n = 1; n <= bomb.range; n++) {
      const x = bomb.x + dx * n, y = bomb.y + dy * n;
      if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) break;
      const i = index(x, y);
      if (geometry[i] === 1) break;
      cells.push(i);
      const other = g.bombs.find(b => b.x === x && b.y === y);
      if (other) queue.push(other);
      if (geometry[i] === 2) { destroyed.add(i); break; }
    }
    g.blasts.push({ cells, until: g.tick + 30 });
    g.events.push({ type: 'explosion', bomb: bomb.id, cells });
  }
  for (const i of destroyed) g.board[i] = 0;
  g.bombs = g.bombs.filter(b => !detonated.has(b.id));
  for (const p of g.players) if (p.alive) {
    const touched = [-.28, .28].some(dx => [-.28, .28].some(dy => g.blasts.some(b => b.cells.includes(index(Math.floor(p.x + dx), Math.floor(p.y + dy))))));
    if (touched) { p.alive = false; g.events.push({ type: 'elimination', player: p.id }); }
  }
}
