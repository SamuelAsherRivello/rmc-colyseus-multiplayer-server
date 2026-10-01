export const WIDTH = 15, HEIGHT = 13, STEP = 1 / 60;
export const index = (x, y) => y * WIDTH + x;
export const tile = p => [Math.floor(p.x), Math.floor(p.y)];
const corners = [[1, 1], [13, 11], [13, 1], [1, 11]];
const mirroredCells = (x, y) => [...new Set([
  index(x, y), index(WIDTH - 1 - x, y),
  index(x, HEIGHT - 1 - y), index(WIDTH - 1 - x, HEIGHT - 1 - y),
])];

export function suddenDeathWaves(board) {
  const seen = new Set(), waves = [];
  for (let ring = 1; ring <= 6; ring++) {
    const right = WIDTH - 1 - ring, bottom = HEIGHT - 1 - ring;
    const perimeter = [];
    for (let x = ring; x <= right; x++) perimeter.push([x, ring]);
    for (let y = ring + 1; y <= bottom; y++) perimeter.push([right, y]);
    for (let x = right - 1; x >= ring; x--) perimeter.push([x, bottom]);
    for (let y = bottom - 1; y > ring; y--) perimeter.push([ring, y]);
    for (const [x, y] of perimeter) {
      const cells = mirroredCells(x, y).filter(i => !seen.has(i) && board[i] !== 1);
      if (!cells.length) continue;
      cells.forEach(i => seen.add(i));
      const warnTick = 5400 + waves.length * 45;
      waves.push({ cells, warnTick, closeTick: warnTick + 60 });
    }
  }
  return waves;
}

export function createGame(ids = ['practice'], seed = 1) {
  const board = Array(WIDTH * HEIGHT).fill(0);
  const hidden = Array(WIDTH * HEIGHT).fill(null);
  let rng = seed >>> 0;
  const random = () => ((rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const i = index(x, y);
    if (!x || !y || x === WIDTH - 1 || y === HEIGHT - 1 || (!(x % 2) && !(y % 2))) board[i] = 1;
  }
  let guaranteed = 0;
  const types = ['bomb', 'range', 'speed'];
  for (let y = 1; y <= 6; y++) for (let x = 1; x <= 7; x++) {
    const cells = mirroredCells(x, y);
    if (board[index(x, y)] || corners.some(([cx, cy]) => Math.abs(cx - x) + Math.abs(cy - y) <= 2)) continue;
    const block = random() < .7;
    let upgrade = null;
    if (block) {
      if (guaranteed < types.length) upgrade = types[guaranteed++];
      else if (random() < .45) upgrade = types[Math.floor(random() * types.length)];
    }
    for (const i of cells) { board[i] = block ? 2 : 0; hidden[i] = upgrade; }
  }
  return { time: 0, tick: 0, board, bombs: [], blasts: [], nextBomb: 1, paused: false,
    hidden, pendingPowerups: [], powerups: [], warnings: [], closed: [], waves: suddenDeathWaves(board),
    players: ids.map((id, n) => ({ id, x: corners[n][0] + .5, y: corners[n][1] + .5, alive: true, capacity: 1, range: 2, speed: 3, speedLevel: 0 })), events: [] };
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
  g.powerups ||= []; g.pendingPowerups ||= []; g.closed ||= [];
  const dangerous = cell => g.blasts.some(b => b.cells.includes(cell));
  g.pendingPowerups = g.pendingPowerups.filter(item => {
    if (dangerous(item.cell)) return true;
    if (!g.board[item.cell]) g.powerups.push(item);
    return false;
  });
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
  g.warnings = (g.waves || []).filter(w => w.warnTick <= g.tick && w.closeTick > g.tick);
  const closing = new Set((g.waves || []).filter(w => w.closeTick === g.tick).flatMap(w => w.cells));
  if (closing.size) {
    for (const cell of closing) { g.board[cell] = 1; g.closed.push(cell); }
    g.bombs = g.bombs.filter(b => !closing.has(index(b.x, b.y)));
    g.powerups = g.powerups.filter(item => !closing.has(item.cell));
    g.pendingPowerups = g.pendingPowerups.filter(item => !closing.has(item.cell));
    for (const b of g.blasts) b.cells = b.cells.filter(cell => !closing.has(cell));
    for (const p of g.players) if (p.alive && [-.28, .28].some(dx => [-.28, .28].some(dy => closing.has(index(Math.floor(p.x + dx), Math.floor(p.y + dy)))))) {
      p.alive = false; g.events.push({ type: 'elimination', player: p.id, cause: 'wall' });
    }
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
    g.blasts.push({ id: bomb.id, cells, until: g.tick + 30 });
    g.events.push({ type: 'explosion', bomb: bomb.id, cells });
  }
  for (const i of destroyed) {
    g.board[i] = 0;
    if (g.hidden?.[i]) { g.pendingPowerups.push({ cell: i, type: g.hidden[i] }); g.hidden[i] = null; }
  }
  g.bombs = g.bombs.filter(b => !detonated.has(b.id));
  for (const p of g.players) if (p.alive) {
    const touched = [-.28, .28].some(dx => [-.28, .28].some(dy => g.blasts.some(b => b.cells.includes(index(Math.floor(p.x + dx), Math.floor(p.y + dy))))));
    if (touched) { p.alive = false; g.events.push({ type: 'elimination', player: p.id }); }
  }
  g.powerups = g.powerups.filter(item => !dangerous(item.cell));
  for (const p of g.players) if (p.alive) {
    const cell = index(...tile(p)), item = g.powerups.find(q => q.cell === cell);
    if (!item) continue;
    if (item.type === 'bomb') p.capacity = Math.min(5, p.capacity + 1);
    if (item.type === 'range') p.range = Math.min(8, p.range + 1);
    if (item.type === 'speed') { p.speedLevel = Math.min(3, (p.speedLevel || 0) + 1); p.speed = 3 * (1 + .15 * p.speedLevel); }
    g.powerups = g.powerups.filter(q => q !== item);
    g.events.push({ type: 'pickup', player: p.id, cell, upgrade: item.type });
  }
}
