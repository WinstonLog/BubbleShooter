class Grid {
  constructor(cols, bubbleRadius = 20) {
    this.cols = cols;
    this.bubbleRadius = bubbleRadius;
    this.bubbles = [];
    this.offsetX = 0;
    this.offsetY = 60;
    this.rowHeight = bubbleRadius * Math.sqrt(3);
    this.dropOffset = 0;
    this.targetDropOffset = 0;

    this._index = new Map();
    this._indexDirty = true;

    this.levelInfo = {
      level: 1,
      colorsCount: 4,
      startRows: 6
    };
  }

  markDirty() {
    this._indexDirty = true;
  }

  _ensureIndex() {
    if (!this._indexDirty) return;
    this._index.clear();
    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      if (b.active) {
        this._index.set(b.row * 1000 + b.col, b);
      }
    }
    this._indexDirty = false;
  }

  setSize(canvasWidth) {
    this.offsetX = (canvasWidth - this.cols * this.bubbleRadius * 2) / 2
                  - this.bubbleRadius / 2;
  }

  getColsInRow(row) {
    return this.cols;
  }

  // 🎯 Минимальный активный row — для границ
  getMinRow() {
    let minRow = Infinity;
    for (const b of this.bubbles) {
      if (b.active && b.row < minRow) minRow = b.row;
    }
    return minRow === Infinity ? 0 : minRow;
  }

  // ============================================================
  // ГЕНЕРАЦИЯ
  // ============================================================
  generate(level) {
    this.bubbles = [];
    this.dropOffset = 0;
    this.targetDropOffset = 0;
    this.markDirty();

    const colorsCount = level === 1 ? 4
                     : level <= 4   ? 5
                     :                6;

    const startRows = level <= 3 ? 6
                    : level <= 6 ? 7
                    : level <= 9 ? 8
                    : level < 20 ? 9
                    :              10;

    this.levelInfo = { level, colorsCount, startRows };

    log(`📦 Level ${level}: ${startRows} rows, ${colorsCount} colors`);

    const palette = Bubble.PALETTE.slice(0, colorsCount).map(c => c.main);

    for (let row = 0; row < startRows; row++) {
      const colsInRow = this.getColsInRow(row);
      const t = startRows > 1 ? row / (startRows - 1) : 0;
      const density = 0.88 - t * 0.23;

      let lastColor = null;
      let streak = 0;
      const targetStreak = 2 + Math.floor(Math.random() * 2);

      for (let col = 0; col < colsInRow; col++) {
        if (Math.random() > density) continue;

        let color;
        if (lastColor && streak < targetStreak && Math.random() < 0.35) {
          color = lastColor;
          streak++;
        } else {
          let attempts = 0;
          do {
            color = palette[Math.floor(Math.random() * palette.length)];
            attempts++;
          } while (color === lastColor && attempts < 4);
          lastColor = color;
          streak = 1;
        }

        const bubble = this.createBubbleAt(row, col, color);
        bubble.spawnTime = performance.now() + row * 20 + col * 5;
        this.bubbles.push(bubble);
      }
    }

    this.breakLargeClusters(palette);
    this.addSpecialBubbles();

    log(`✅ Level ${level}: ${this.bubbles.length} bubbles placed`);
  }

  breakLargeClusters(palette) {
    const visited = new Set();

    for (const b of this.bubbles) {
      const key = `${b.row},${b.col}`;
      if (visited.has(key)) continue;

      const cluster = this.findCluster(b);
      for (const c of cluster) {
        visited.add(`${c.row},${c.col}`);
      }

      if (cluster.length > 5) {
        for (let i = 4; i < cluster.length; i++) {
          const otherColors = palette.filter(c => c !== b.color);
          if (otherColors.length > 0) {
            cluster[i].color = otherColors[
              Math.floor(Math.random() * otherColors.length)
            ];
          }
        }
      }
    }
  }

  addSpecialBubbles() {
    let fireCount = 0;
    const midCol = (this.cols - 1) / 2;
    const isLevel1 = this.levelInfo.level === 1;

    if (isLevel1) {
      let firePool = this.bubbles.filter(b =>
        !b.isFire &&
        b.row >= 3 && b.row <= 4 &&
        b.col >= 3 && b.col <= this.cols - 4
      );

      if (firePool.length === 0) {
        firePool = this.bubbles.filter(b => !b.isFire && b.row >= 2);
      }

      if (firePool.length > 0) {
        firePool.sort((a, b) =>
          Math.abs(a.col - midCol) - Math.abs(b.col - midCol)
        );

        const fire = firePool[0];
        fire.isFire = true;
        fireCount++;

        const neighbors = this.getNeighbors(fire.row, fire.col);
        let recolored = 0;
        for (const n of neighbors) {
          if (n.color === fire.color && recolored < 2) {
            const otherColors = Bubble.PALETTE
              .slice(0, this.levelInfo.colorsCount)
              .map(c => c.main)
              .filter(c => c !== fire.color);
            if (otherColors.length > 0) {
              n.color = otherColors[Math.floor(Math.random() * otherColors.length)];
              recolored++;
            }
          }
        }
      }
    }

    for (const b of this.bubbles) {
      if (b.isFire) continue;
      if (Math.random() < 0.035) {
        b.isFire = true;
        fireCount++;
      }
    }

    if (fireCount > 0) log(`🔥 Fire bubbles: ${fireCount}`);
  }

  createBubbleAt(row, col, color) {
    const x = this.getX(row, col);
    const y = this.getY(row);
    const bubble = new Bubble(x, y, color, this.bubbleRadius);
    bubble.row = row;
    bubble.col = col;
    bubble.isFire = false;
    return bubble;
  }

  getX(row, col) {
    const isEven = ((row % 2) + 2) % 2 === 0;
    const offset = isEven ? 0 : this.bubbleRadius;
    return this.offsetX + col * this.bubbleRadius * 2 + this.bubbleRadius + offset;
  }

  getY(row) {
    return this.offsetY + row * this.rowHeight + this.bubbleRadius + this.dropOffset;
  }

  // ============================================================
  // 🎯 SNAP TO GRID — с защитой от ухода выше верхнего ряда
  // ============================================================
  snapToGrid(bubble) {
    const rollback = 2;
    const speed = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy);
    let snapX = bubble.x;
    let snapY = bubble.y;

    if (speed > 0.1) {
      const nx = bubble.vx / speed;
      const ny = bubble.vy / speed;
      snapX = bubble.x - nx * rollback;
      snapY = bubble.y - ny * rollback;
    }

    const rowRaw = (snapY - this.offsetY - this.bubbleRadius - this.dropOffset) / this.rowHeight;
    let row = Math.round(rowRaw);

    // 🎯 Не давать улетать выше, чем на 1 ряд над верхним
    const gridMinRow = this.getMinRow();
    row = Math.max(gridMinRow - 1, row);

    const isEven = ((row % 2) + 2) % 2 === 0;
    const offset = isEven ? 0 : this.bubbleRadius;
    const colRaw = (snapX - this.offsetX - this.bubbleRadius - offset) / (this.bubbleRadius * 2);

    const colsInRow = this.getColsInRow(row);
    const col = Math.max(0, Math.min(colsInRow - 1, Math.round(colRaw)));

    bubble.row = row;
    bubble.col = col;
    bubble.x = this.getX(row, col);
    bubble.y = this.getY(row);

    return bubble;
  }

  findNearestFreeSlot(bubble) {
    const candidates = [];
    const rowOffsets = [0, -1, 1, -2, 2];

    for (const dr of rowOffsets) {
      const r = bubble.row + dr;

      const colOffsets = [-1, 0, 1];

      for (const dc of colOffsets) {
        const c = bubble.col + dc;
        const colsInRow = this.getColsInRow(r);
        if (c < 0 || c >= colsInRow) continue;

        if (this.getBubbleAt(r, c)) continue;

        const slotX = this.getX(r, c);
        const slotY = this.getY(r);
        const dx = slotX - bubble.x;
        const dy = slotY - bubble.y;
        const distSq = dx * dx + dy * dy;

        candidates.push({ row: r, col: c, distSq });
      }
    }

    if (candidates.length === 0) {
      return this.findNearestFreeSlotWide(bubble);
    }

    candidates.sort((a, b) => a.distSq - b.distSq);

    return { row: candidates[0].row, col: candidates[0].col };
  }

  findNearestFreeSlotWide(bubble) {
    let bestSlot = null;
    let bestDistSq = Infinity;

    for (let dr = -2; dr <= 2; dr++) {
      const r = bubble.row + dr;
      const colsInRow = this.getColsInRow(r);

      for (let c = 0; c < colsInRow; c++) {
        if (this.getBubbleAt(r, c)) continue;

        const slotX = this.getX(r, c);
        const slotY = this.getY(r);
        const dx = slotX - bubble.x;
        const dy = slotY - bubble.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < bestDistSq) {
          bestDistSq = distSq;
          bestSlot = { row: r, col: c };
        }
      }
    }

    return bestSlot;
  }

  findFreeSlot(bubble) {
    this.snapToGrid(bubble);
    if (!this.getBubbleAt(bubble.row, bubble.col)) return true;

    const slot = this.findNearestFreeSlot(bubble);
    if (slot) {
      bubble.row = slot.row;
      bubble.col = slot.col;
      bubble.x = this.getX(slot.row, slot.col);
      bubble.y = this.getY(slot.row);
      return true;
    }
    return false;
  }

  getNeighbors(row, col) {
    const isEven = ((row % 2) + 2) % 2 === 0;
    const offsets = isEven
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

    const neighbors = [];
    for (const [dr, dc] of offsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nc < 0) continue;
      const colsInRow = this.getColsInRow(nr);
      if (nc >= colsInRow) continue;
      const b = this.getBubbleAt(nr, nc);
      if (b) neighbors.push(b);
    }
    return neighbors;
  }

  getBubbleAt(row, col) {
    this._ensureIndex();
    return this._index.get(row * 1000 + col) || null;
  }

  findCluster(startBubble) {
    const cluster = [];
    const visited = new Set();
    const stack = [startBubble];

    while (stack.length) {
      const bubble = stack.pop();
      const key = `${bubble.row},${bubble.col}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (bubble.color !== startBubble.color) continue;

      cluster.push(bubble);

      const neighbors = this.getNeighbors(bubble.row, bubble.col);
      for (const neighbor of neighbors) {
        if (neighbor.color === startBubble.color) {
          stack.push(neighbor);
        }
      }
    }
    return cluster;
  }

  // ============================================================
  // 🎯 FIND FLOATING — потолок из 3 верхних рядов
  // (защита от пропусков в верхних рядах)
  // ============================================================
  findFloating() {
    const active = this.bubbles.filter(b => b.active);
    if (active.length === 0) return [];

    const minRow = this.getMinRow();
    const ceilingRows = [minRow, minRow + 1, minRow + 2];

    const connected = new Set();
    const stack = [];

    for (const b of active) {
      if (ceilingRows.includes(b.row)) {
        stack.push(b);
      }
    }

    while (stack.length) {
      const bubble = stack.pop();
      const key = `${bubble.row},${bubble.col}`;
      if (connected.has(key)) continue;
      connected.add(key);

      const neighbors = this.getNeighbors(bubble.row, bubble.col);
      for (const neighbor of neighbors) {
        if (!connected.has(`${neighbor.row},${neighbor.col}`)) {
          stack.push(neighbor);
        }
      }
    }

    return active.filter(b => !connected.has(`${b.row},${b.col}`));
  }

  getActiveColors() {
    const set = new Set();
    for (const b of this.bubbles) {
      if (b.active) set.add(b.color);
    }
    return [...set];
  }

  getUsableColors() {
    const active = this.bubbles.filter(b => b.active);
    if (active.length === 0) return [];

    let maxRow = -Infinity;
    for (const b of active) {
      if (b.row > maxRow) maxRow = b.row;
    }

    const rowDepth = 4;
    const minUsableRow = maxRow - rowDepth + 1;

    const usableColors = new Set();

    for (const b of active) {
      if (b.row >= minUsableRow) {
        usableColors.add(b.color);
      }
    }

    for (const b of active) {
      if (b.row >= minUsableRow) {
        const neighbors = this.getNeighbors(b.row, b.col);
        for (const n of neighbors) {
          if (n.color) usableColors.add(n.color);
        }
      }
    }

    if (usableColors.size === 0) {
      return this.getActiveColors();
    }

    return [...usableColors];
  }

  update(dt) {
    for (const b of this.bubbles) {
      b.update(dt);
    }
  }

  draw(ctx) {
    for (const bubble of this.bubbles) {
      if (bubble.active) bubble.draw(ctx);
    }
  }
}