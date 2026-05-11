(() => {
  const GRID = 8;
  const STORAGE = {
    name: "gridrush:name",
    theme: "gridrush:theme",
  };

  const SHAPES = [
    [[0, 0]],
    [[0, 0], [0, 1]],
    [[0, 0], [1, 0]],
    [[0, 0], [0, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [2, 1]],
    [[0, 1], [1, 1], [2, 1], [2, 0]],
    [[0, 0], [0, 1], [0, 2], [1, 1]],
    [[0, 1], [1, 0], [1, 1], [1, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[0, 1], [1, 1], [1, 0], [2, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 0], [2, 0], [2, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]],
  ].map(normalizeShape);

  const BLOCKS = [
    ["#24e8d0", "#1697ff"],
    ["#ffcc2f", "#ff7a35"],
    ["#ff5b95", "#a957ff"],
    ["#75ff89", "#13bd72"],
    ["#8aa0ff", "#3568ff"],
    ["#ffffff", "#9fd7ff"],
  ];

  const SCENARIOS = [
    {
      id: "clean",
      name: "Griglia pulita",
      pattern: [
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
        "........",
      ],
    },
    {
      id: "crown",
      name: "Corona",
      pattern: [
        "x......x",
        "xx....xx",
        ".x....x.",
        "........",
        "...xx...",
        "..xxxx..",
        "........",
        "x......x",
      ],
    },
    {
      id: "squeeze",
      name: "Strettoia",
      pattern: [
        "xx....xx",
        "x......x",
        "........",
        "..xxxx..",
        "..x..x..",
        "..xxxx..",
        "x......x",
        "xx....xx",
      ],
    },
    {
      id: "rush",
      name: "Ultima spinta",
      pattern: [
        "xxx.xxxx",
        "........",
        "..xx....",
        "..xx....",
        "....xx..",
        "....xx..",
        "........",
        "xxxx.xxx",
      ],
    },
    {
      id: "stairs",
      name: "Scale",
      pattern: [
        "x.......",
        "xx......",
        ".xx.....",
        "..xx....",
        "...xx...",
        "....xx..",
        ".....xx.",
        "......xx",
      ],
    },
    {
      id: "vault",
      name: "Cassaforte",
      pattern: [
        "xxxxxxxx",
        "x......x",
        "x..xx..x",
        "x..xx..x",
        "x......x",
        "x..xx..x",
        "x......x",
        "xxxxxxxx",
      ],
    },
  ];

  const els = {};
  const state = {
    playerName: "",
    duration: 60,
    scenario: "clean",
    theme: "neon",
    screen: "profileScreen",
    board: [],
    tray: [],
    selectedPiece: 0,
    hoverCell: null,
    dragging: {
      active: false,
      index: null,
      moved: false,
      justDragged: false,
      startX: 0,
      startY: 0,
      preview: null,
    },
    score: 0,
    lines: 0,
    combo: 0,
    rng: mulberry32(1),
    seed: 1,
    timerId: null,
    botId: null,
    endsAt: 0,
    finished: false,
    locked: false,
    clearSet: new Set(),
    lastConfig: null,
    online: {
      roomCode: null,
      playerId: null,
      eventSource: null,
      pollingId: null,
      room: null,
    },
    bot: null,
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    renderScenarios();
    loadSavedProfile();
    bindEvents();
    setTheme(state.theme);
    renderLobbyState();
    renderBoard();
    renderTray();

    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }

  function cacheElements() {
    [
      "profileScreen",
      "lobbyScreen",
      "gameScreen",
      "playerName",
      "enterArena",
      "playerInitial",
      "playerLabel",
      "scenarioName",
      "scenarioList",
      "scenarioPlayButton",
      "matchmakeButton",
      "friendRoomButton",
      "practiceButton",
      "roomCodeInput",
      "joinRoomButton",
      "homeLogo",
      "backToLobby",
      "board",
      "pieceTray",
      "timerLabel",
      "myName",
      "myScore",
      "myLines",
      "opponentList",
      "roomCodeButton",
      "restartButton",
      "matchModeLabel",
      "onlineModal",
      "modalTitle",
      "modalRoomCode",
      "modalStatus",
      "closeModal",
      "toast",
    ].forEach((id) => {
      els[id] = document.getElementById(id);
    });
  }

  function loadSavedProfile() {
    state.playerName = localStorage.getItem(STORAGE.name) || "";
    state.theme = localStorage.getItem(STORAGE.theme) || "neon";
    els.playerName.value = state.playerName;
  }

  function bindEvents() {
    els.enterArena.addEventListener("click", enterArena);
    els.playerName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") enterArena();
    });
    els.homeLogo.addEventListener("click", () => showScreen("lobbyScreen"));

    document.querySelectorAll("[data-duration]").forEach((button) => {
      button.addEventListener("click", () => {
        state.duration = Number(button.dataset.duration);
        renderLobbyState();
      });
    });

    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
    });

    els.practiceButton.addEventListener("click", () => {
      startGame({
        mode: "Allenamento",
        duration: state.duration,
        scenario: state.scenario,
        seed: makeSeed(),
        online: false,
        bot: true,
      });
    });

    els.scenarioPlayButton.addEventListener("click", () => {
      startGame({
        mode: "Situazione",
        duration: state.duration,
        scenario: state.scenario,
        seed: makeSeed(),
        online: false,
        bot: true,
      });
    });

    els.friendRoomButton.addEventListener("click", createFriendRoom);
    els.matchmakeButton.addEventListener("click", findOnlineMatch);
    els.joinRoomButton.addEventListener("click", joinFriendRoom);
    els.roomCodeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") joinFriendRoom();
    });

    els.board.addEventListener("pointerleave", () => {
      if (state.dragging.active) return;
      state.hoverCell = null;
      renderBoard();
    });

    els.backToLobby.addEventListener("click", () => {
      stopGame();
      closeOnlineConnection();
      hideModal();
      showScreen("lobbyScreen");
    });

    els.restartButton.addEventListener("click", () => {
      const next = state.lastConfig || {
        mode: "Allenamento",
        duration: state.duration,
        scenario: state.scenario,
        seed: makeSeed(),
        online: false,
        bot: true,
      };
      startGame({ ...next, seed: makeSeed(), online: false, bot: true, room: null });
    });

    els.closeModal.addEventListener("click", hideModal);
    els.roomCodeButton.addEventListener("click", copyRoomCode);
  }

  function enterArena() {
    const name = els.playerName.value.trim().slice(0, 18);
    if (!name) {
      els.playerName.focus();
      toast("Inserisci un nome per entrare.");
      return;
    }
    state.playerName = name;
    localStorage.setItem(STORAGE.name, name);
    renderPlayer();
    showScreen("lobbyScreen");
  }

  function setTheme(theme) {
    state.theme = theme;
    document.body.dataset.theme = theme;
    localStorage.setItem(STORAGE.theme, theme);
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.classList.toggle("active", button.dataset.themeChoice === theme);
    });
  }

  function showScreen(id) {
    state.screen = id;
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.toggle("active", screen.id === id);
    });
  }

  function renderPlayer() {
    const name = state.playerName || "Giocatore";
    els.playerLabel.textContent = name;
    els.playerInitial.textContent = name.trim().charAt(0).toUpperCase() || "G";
  }

  function renderLobbyState() {
    renderPlayer();
    document.querySelectorAll("[data-duration]").forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.duration) === state.duration);
    });

    const scenario = getScenario(state.scenario);
    els.scenarioName.textContent = scenario.name;
    document.querySelectorAll("[data-scenario-id]").forEach((button) => {
      button.classList.toggle("selected", button.dataset.scenarioId === state.scenario);
    });
  }

  function renderScenarios() {
    els.scenarioList.innerHTML = "";
    SCENARIOS.forEach((scenario) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scenario-button";
      button.dataset.scenarioId = scenario.id;

      const mini = document.createElement("div");
      mini.className = "mini-board";
      scenario.pattern.join("").split("").forEach((char) => {
        const cell = document.createElement("i");
        if (char === "x") cell.className = "filled";
        mini.appendChild(cell);
      });

      const label = document.createElement("span");
      label.textContent = scenario.name;
      button.append(mini, label);
      button.addEventListener("click", () => {
        state.scenario = scenario.id;
        renderLobbyState();
      });
      els.scenarioList.appendChild(button);
    });
  }

  function startGame(config) {
    stopGame();
    state.lastConfig = { ...config };
    state.score = 0;
    state.lines = 0;
    state.combo = 0;
    state.finished = false;
    state.locked = false;
    state.clearSet = new Set();
    state.hoverCell = null;
    cancelPieceDrag(false);
    state.selectedPiece = 0;
    state.duration = config.duration;
    state.scenario = config.scenario;
    state.seed = config.seed || makeSeed();
    state.rng = mulberry32(state.seed);
    state.board = buildScenarioBoard(getScenario(config.scenario));
    state.tray = [makePiece(), makePiece(), makePiece()];
    state.bot = config.bot ? makeBot(config.duration) : null;
    state.online.roomCode = config.room?.code || null;
    state.online.room = config.room || null;
    state.endsAt = config.startedAt
      ? config.startedAt + config.duration * 1000
      : Date.now() + config.duration * 1000;

    els.matchModeLabel.textContent = config.mode;
    els.myName.textContent = state.playerName || "Tu";
    els.roomCodeButton.textContent = state.online.roomCode || "Locale";
    showScreen("gameScreen");
    window.scrollTo(0, 0);
    renderAll();
    syncOnlineState();

    state.timerId = window.setInterval(tickTimer, 250);
    if (state.bot) startBot();
    tickTimer();
  }

  function stopGame() {
    if (state.timerId) window.clearInterval(state.timerId);
    if (state.botId) window.clearInterval(state.botId);
    state.timerId = null;
    state.botId = null;
  }

  function tickTimer() {
    const remainingMs = Math.max(0, state.endsAt - Date.now());
    const remaining = Math.ceil(remainingMs / 1000);
    els.timerLabel.textContent = formatTime(remaining);
    if (remaining <= 10 && remaining > 0) {
      els.timerLabel.parentElement.style.filter = "saturate(1.6) brightness(1.15)";
    } else {
      els.timerLabel.parentElement.style.filter = "";
    }
    if (remaining <= 0 && !state.finished) {
      finishGame("Tempo scaduto");
    }
  }

  function renderAll() {
    renderBoard();
    renderTray();
    renderScores();
  }

  function renderBoard() {
    const board = els.board;
    const selected = state.tray[state.selectedPiece];
    const hover = state.hoverCell;
    const ghost = selected && hover !== null ? getGhost(selected, indexToPoint(hover)) : null;

    board.classList.toggle("drag-over", state.dragging.active && hover !== null);
    board.innerHTML = "";
    for (let i = 0; i < GRID * GRID; i += 1) {
      const cellData = state.board[i];
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Cella ${i + 1}`);
      cell.dataset.index = String(i);

      if (cellData) {
        cell.classList.add("filled");
        setBlockStyle(cell, cellData.palette);
      }
      if (state.clearSet.has(i)) {
        cell.classList.add("clear");
      }
      if (ghost?.cells.has(i) && !cellData) {
        cell.classList.add(ghost.valid ? "ghost-valid" : "ghost-bad");
      }

      cell.addEventListener("pointerenter", () => {
        if (state.hoverCell !== i) {
          state.hoverCell = i;
          renderBoard();
        }
      });
      cell.addEventListener("click", () => placeSelectedPiece(i));
      board.appendChild(cell);
    }
  }

  function renderTray() {
    els.pieceTray.innerHTML = "";
    state.tray.forEach((piece, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "piece-card";
      button.setAttribute("aria-label", `Pezzo ${index + 1}`);
      if (!piece) {
        button.classList.add("disabled");
      } else {
        if (index === state.selectedPiece) button.classList.add("selected");
        if (state.dragging.active && state.dragging.index === index) button.classList.add("dragging");
        if (!canAnyFit(piece)) button.classList.add("no-fit");
        button.draggable = false;
        button.appendChild(renderPiecePreview(piece));
        button.addEventListener("pointerdown", (event) => beginPieceDrag(index, event));
        button.addEventListener("mousedown", (event) => beginPieceDrag(index, event));
        button.addEventListener("touchstart", (event) => beginPieceDrag(index, event), { passive: false });
        button.addEventListener("click", () => {
          if (state.dragging.justDragged) return;
          state.selectedPiece = index;
          state.hoverCell = null;
          renderAll();
        });
      }
      els.pieceTray.appendChild(button);
    });
  }

  function renderPiecePreview(piece) {
    const preview = document.createElement("div");
    preview.className = "piece-grid";
    const maxRow = Math.max(...piece.cells.map(([row]) => row));
    const maxCol = Math.max(...piece.cells.map(([, col]) => col));
    const offsetRow = Math.max(0, Math.floor((4 - (maxRow + 1)) / 2));
    const offsetCol = Math.max(0, Math.floor((4 - (maxCol + 1)) / 2));
    const occupied = new Set(piece.cells.map(([row, col]) => `${row + offsetRow}:${col + offsetCol}`));
    for (let i = 0; i < 16; i += 1) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const cell = document.createElement("span");
      cell.className = "piece-cell";
      if (occupied.has(`${row}:${col}`)) {
        cell.classList.add("on");
        setBlockStyle(cell, piece.palette);
      }
      preview.appendChild(cell);
    }
    return preview;
  }

  function beginPieceDrag(index, event) {
    if (state.dragging.active) return;
    if (state.locked || state.finished) return;
    if (event.button !== undefined && event.button !== 0) return;

    const piece = state.tray[index];
    if (!piece || !canAnyFit(piece)) return;
    const point = eventPoint(event);
    if (!point) return;

    event.preventDefault();
    if (event.pointerId !== undefined) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    state.selectedPiece = index;
    state.dragging.active = true;
    state.dragging.index = index;
    state.dragging.moved = false;
    state.dragging.startX = point.x;
    state.dragging.startY = point.y;
    state.dragging.preview = createDragPreview(piece);
    document.body.classList.add("is-dragging-piece");
    event.currentTarget.classList.add("dragging");

    updatePieceDrag(point);
    window.addEventListener("pointermove", movePieceDrag, { passive: false });
    window.addEventListener("pointerup", endPieceDrag);
    window.addEventListener("pointercancel", cancelPieceDrag);
    window.addEventListener("mousemove", movePieceDrag, { passive: false });
    window.addEventListener("mouseup", endPieceDrag);
    window.addEventListener("touchmove", movePieceDrag, { passive: false });
    window.addEventListener("touchend", endPieceDrag);
    window.addEventListener("touchcancel", cancelPieceDrag);
  }

  function movePieceDrag(event) {
    if (!state.dragging.active) return;
    const point = eventPoint(event);
    if (!point) return;
    event.preventDefault();
    const dx = Math.abs(point.x - state.dragging.startX);
    const dy = Math.abs(point.y - state.dragging.startY);
    if (dx + dy > 5) state.dragging.moved = true;
    updatePieceDrag(point);
  }

  function updatePieceDrag(point) {
    if (state.dragging.preview) {
      state.dragging.preview.style.left = `${point.x}px`;
      state.dragging.preview.style.top = `${point.y}px`;
    }

    const nextHover = boardCellFromDragPreview();
    if (state.hoverCell !== nextHover) {
      state.hoverCell = nextHover;
      renderBoard();
    }
  }

  function endPieceDrag(event) {
    if (!state.dragging.active) return;
    const point = eventPoint(event);
    if (point) {
      if (state.dragging.preview) {
        state.dragging.preview.style.left = `${point.x}px`;
        state.dragging.preview.style.top = `${point.y}px`;
      }
      state.hoverCell = boardCellFromDragPreview();
    }
    const targetCell = state.hoverCell;
    const shouldPlace = state.dragging.moved && targetCell !== null;
    cleanupPieceDrag();
    if (shouldPlace) {
      placeSelectedPiece(targetCell);
      return;
    }
    state.hoverCell = null;
    renderAll();
  }

  function cancelPieceDrag(render = true) {
    if (!state.dragging.active && !state.dragging.preview) return;
    cleanupPieceDrag();
    state.hoverCell = null;
    if (render) renderAll();
  }

  function cleanupPieceDrag() {
    window.removeEventListener("pointermove", movePieceDrag);
    window.removeEventListener("pointerup", endPieceDrag);
    window.removeEventListener("pointercancel", cancelPieceDrag);
    window.removeEventListener("mousemove", movePieceDrag);
    window.removeEventListener("mouseup", endPieceDrag);
    window.removeEventListener("touchmove", movePieceDrag);
    window.removeEventListener("touchend", endPieceDrag);
    window.removeEventListener("touchcancel", cancelPieceDrag);
    document.body.classList.remove("is-dragging-piece");
    const didMove = state.dragging.moved;
    state.dragging.preview?.remove();
    state.dragging.active = false;
    state.dragging.index = null;
    state.dragging.moved = false;
    state.dragging.preview = null;
    if (didMove) {
      state.dragging.justDragged = true;
      window.setTimeout(() => {
        state.dragging.justDragged = false;
      }, 150);
    }
  }

  function createDragPreview(piece) {
    const preview = document.createElement("div");
    preview.className = "drag-preview";
    preview.appendChild(renderDragPiece(piece));
    document.body.appendChild(preview);
    return preview;
  }

  function renderDragPiece(piece) {
    const grid = document.createElement("div");
    const maxRow = Math.max(...piece.cells.map(([row]) => row));
    const maxCol = Math.max(...piece.cells.map(([, col]) => col));
    const rows = maxRow + 1;
    const cols = maxCol + 1;
    const { cellSize, gap } = getBoardCellMetrics();
    const occupied = new Set(piece.cells.map(([row, col]) => `${row}:${col}`));

    grid.className = "drag-piece-grid";
    grid.style.setProperty("--drag-cols", cols);
    grid.style.setProperty("--drag-cell", `${cellSize}px`);
    grid.style.setProperty("--drag-gap", `${gap}px`);
    grid.style.width = `${cols * cellSize + Math.max(0, cols - 1) * gap}px`;
    grid.style.height = `${rows * cellSize + Math.max(0, rows - 1) * gap}px`;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cell = document.createElement("span");
        cell.className = "piece-cell";
        if (occupied.has(`${row}:${col}`)) {
          cell.classList.add("on");
          setBlockStyle(cell, piece.palette);
        }
        grid.appendChild(cell);
      }
    }

    return grid;
  }

  function getBoardCellMetrics() {
    const rect = els.board.getBoundingClientRect();
    const style = window.getComputedStyle(els.board);
    const gap = Number.parseFloat(style.columnGap) || 0;
    const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(style.paddingRight) || 0;
    const paddingTop = Number.parseFloat(style.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
    const cellSize = Math.max(22, (rect.width - paddingLeft - paddingRight - gap * (GRID - 1)) / GRID);
    return { cellSize, gap, paddingLeft, paddingRight, paddingTop, paddingBottom };
  }

  function eventPoint(event) {
    const touch = event?.touches?.[0] || event?.changedTouches?.[0];
    if (touch) return { x: touch.clientX, y: touch.clientY };
    if (event?.clientX !== undefined && event?.clientY !== undefined) {
      return { x: event.clientX, y: event.clientY };
    }
    return null;
  }

  function boardCellFromPoint(x, y) {
    const rect = els.board.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      return null;
    }
    const col = Math.min(GRID - 1, Math.max(0, Math.floor(((x - rect.left) / rect.width) * GRID)));
    const row = Math.min(GRID - 1, Math.max(0, Math.floor(((y - rect.top) / rect.height) * GRID)));
    return pointToIndex(row, col);
  }

  function boardCellFromDragPreview() {
    if (!state.dragging.preview) return null;
    const previewRect = state.dragging.preview.getBoundingClientRect();
    const boardRect = els.board.getBoundingClientRect();
    const metrics = getBoardCellMetrics();
    const step = metrics.cellSize + metrics.gap;
    const gridLeft = boardRect.left + metrics.paddingLeft;
    const gridTop = boardRect.top + metrics.paddingTop;
    const gridRight = boardRect.right - metrics.paddingRight;
    const gridBottom = boardRect.bottom - metrics.paddingBottom;
    const pieceCenterX = previewRect.left + metrics.cellSize / 2;
    const pieceCenterY = previewRect.top + metrics.cellSize / 2;

    if (
      pieceCenterX < gridLeft ||
      pieceCenterX > gridRight ||
      pieceCenterY < gridTop ||
      pieceCenterY > gridBottom
    ) {
      return null;
    }

    const col = Math.round((previewRect.left - gridLeft) / step);
    const row = Math.round((previewRect.top - gridTop) / step);
    if (!isInside(row, col)) return null;
    return pointToIndex(row, col);
  }

  function renderScores() {
    els.myScore.textContent = String(state.score);
    els.myLines.textContent = `${state.lines} linee`;
    els.opponentList.innerHTML = "";

    const opponents = [];
    if (state.online.room?.players?.length) {
      state.online.room.players.forEach((player) => {
        if (player.id !== state.online.playerId) opponents.push(player);
      });
    }
    if (state.bot) opponents.push(state.bot);

    if (!opponents.length) {
      const empty = document.createElement("div");
      empty.className = "opponent-card";
      empty.innerHTML = "<span>Avversario</span><strong>--</strong><small>in attesa</small>";
      els.opponentList.appendChild(empty);
      return;
    }

    opponents.forEach((opponent) => {
      const card = document.createElement("div");
      card.className = "opponent-card";
      const name = escapeHtml(opponent.name || "Rivale");
      const score = Number(opponent.score || 0);
      const lines = Number(opponent.lines || 0);
      card.innerHTML = `<span>${name}</span><strong>${score}</strong><small>${lines} linee</small>`;
      els.opponentList.appendChild(card);
    });
  }

  function placeSelectedPiece(index) {
    if (state.locked || state.finished) return;
    const piece = state.tray[state.selectedPiece];
    if (!piece) return;

    const point = indexToPoint(index);
    if (!canPlace(piece, point.row, point.col)) {
      toast("Quel pezzo non entra li.");
      return;
    }

    piece.cells.forEach(([row, col]) => {
      const boardIndex = pointToIndex(point.row + row, point.col + col);
      state.board[boardIndex] = { palette: piece.palette };
    });

    state.score += piece.cells.length * 10;
    state.tray[state.selectedPiece] = null;
    const lineInfo = findCompleteLines();
    if (lineInfo.cells.size) {
      state.locked = true;
      state.clearSet = lineInfo.cells;
      state.score += lineInfo.count * 120 + Math.max(0, state.combo) * 45;
      state.lines += lineInfo.count;
      state.combo += 1;
      renderAll();
      window.setTimeout(() => {
        lineInfo.cells.forEach((cellIndex) => {
          state.board[cellIndex] = null;
        });
        state.clearSet = new Set();
        state.locked = false;
        endTurn();
      }, 220);
      return;
    }

    state.combo = 0;
    endTurn();
  }

  function endTurn() {
    if (state.tray.every((piece) => piece === null)) {
      state.tray = [makePiece(), makePiece(), makePiece()];
      state.selectedPiece = 0;
    } else {
      const next = state.tray.findIndex((piece) => piece !== null);
      state.selectedPiece = next >= 0 ? next : 0;
    }

    renderAll();
    syncOnlineState();

    if (!state.tray.some((piece) => piece && canAnyFit(piece))) {
      finishGame("Nessuna mossa disponibile");
    }
  }

  function finishGame(reason) {
    state.finished = true;
    stopGame();
    renderAll();
    syncOnlineState(true);
    toast(reason);
  }

  function findCompleteLines() {
    const cells = new Set();
    let count = 0;

    for (let row = 0; row < GRID; row += 1) {
      const full = Array.from({ length: GRID }, (_, col) => pointToIndex(row, col)).every((i) => state.board[i]);
      if (full) {
        count += 1;
        for (let col = 0; col < GRID; col += 1) cells.add(pointToIndex(row, col));
      }
    }

    for (let col = 0; col < GRID; col += 1) {
      const full = Array.from({ length: GRID }, (_, row) => pointToIndex(row, col)).every((i) => state.board[i]);
      if (full) {
        count += 1;
        for (let row = 0; row < GRID; row += 1) cells.add(pointToIndex(row, col));
      }
    }

    return { cells, count };
  }

  function getGhost(piece, point) {
    const cells = new Set();
    let valid = true;
    piece.cells.forEach(([row, col]) => {
      const nextRow = point.row + row;
      const nextCol = point.col + col;
      if (!isInside(nextRow, nextCol)) {
        valid = false;
        return;
      }
      const index = pointToIndex(nextRow, nextCol);
      cells.add(index);
      if (state.board[index]) valid = false;
    });
    return { cells, valid };
  }

  function canPlace(piece, row, col) {
    return piece.cells.every(([cellRow, cellCol]) => {
      const nextRow = row + cellRow;
      const nextCol = col + cellCol;
      return isInside(nextRow, nextCol) && !state.board[pointToIndex(nextRow, nextCol)];
    });
  }

  function canAnyFit(piece) {
    if (!piece) return false;
    for (let row = 0; row < GRID; row += 1) {
      for (let col = 0; col < GRID; col += 1) {
        if (canPlace(piece, row, col)) return true;
      }
    }
    return false;
  }

  function makePiece() {
    const shape = SHAPES[Math.floor(state.rng() * SHAPES.length)];
    const palette = BLOCKS[Math.floor(state.rng() * BLOCKS.length)];
    return {
      id: randomToken(8),
      cells: shape.map((cell) => [...cell]),
      palette,
    };
  }

  function buildScenarioBoard(scenario) {
    const board = Array.from({ length: GRID * GRID }, () => null);
    scenario.pattern.forEach((rowText, row) => {
      rowText.split("").forEach((char, col) => {
        if (char === "x") {
          const palette = BLOCKS[Math.floor(state.rng() * BLOCKS.length)];
          board[pointToIndex(row, col)] = { palette };
        }
      });
    });
    return board;
  }

  function makeBot(duration) {
    return {
      id: "bot",
      name: "Rush Bot",
      score: 0,
      lines: 0,
      tempo: Math.max(900, Math.min(1800, duration * 11)),
    };
  }

  function startBot() {
    if (!state.bot) return;
    state.botId = window.setInterval(() => {
      if (!state.bot || state.finished) return;
      const burst = 35 + Math.floor(state.rng() * 160);
      state.bot.score += burst;
      if (state.rng() > 0.56) state.bot.lines += 1;
      renderScores();
    }, state.bot.tempo);
  }

  async function createFriendRoom() {
    if (!ensureName()) return;
    const playerId = getPlayerId();
    try {
      const room = await api("/api/rooms", {
        playerId,
        name: state.playerName,
        duration: state.duration,
        scenario: state.scenario,
      });
      state.online.playerId = playerId;
      showWaiting(room, "Stanza amici");
      connectToRoom(room.code);
    } catch (error) {
      toast("Server online non raggiungibile. Avvio una sfida demo.");
      startGame({
        mode: "Online demo",
        duration: state.duration,
        scenario: state.scenario,
        seed: makeSeed(),
        online: false,
        bot: true,
      });
    }
  }

  async function joinFriendRoom() {
    if (!ensureName()) return;
    const code = els.roomCodeInput.value.trim().toUpperCase();
    if (!code) {
      toast("Inserisci un codice stanza.");
      return;
    }
    const playerId = getPlayerId();
    try {
      const room = await api(`/api/rooms/${encodeURIComponent(code)}/join`, {
        playerId,
        name: state.playerName,
      });
      state.online.playerId = playerId;
      showWaiting(room, "Connessione");
      connectToRoom(room.code);
      handleRoom(room);
    } catch (error) {
      toast("Codice stanza non trovato.");
    }
  }

  async function findOnlineMatch() {
    if (!ensureName()) return;
    const playerId = getPlayerId();
    try {
      const room = await api("/api/matchmake", {
        playerId,
        name: state.playerName,
        duration: state.duration,
        scenario: state.scenario,
      });
      state.online.playerId = playerId;
      showWaiting(room, room.status === "active" ? "Match trovato" : "Matchmaking");
      connectToRoom(room.code);
      handleRoom(room);
    } catch (error) {
      toast("Server online non raggiungibile. Ti metto contro Rush Bot.");
      startGame({
        mode: "Match rapido",
        duration: state.duration,
        scenario: state.scenario,
        seed: makeSeed(),
        online: false,
        bot: true,
      });
    }
  }

  function connectToRoom(code) {
    closeOnlineConnection();
    state.online.roomCode = code;

    if ("EventSource" in window) {
      const source = new EventSource(`/api/events/${encodeURIComponent(code)}/${encodeURIComponent(state.online.playerId)}`);
      source.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.room) handleRoom(payload.room);
      };
      source.onerror = () => {
        source.close();
        startPollingRoom(code);
      };
      state.online.eventSource = source;
      return;
    }

    startPollingRoom(code);
  }

  function startPollingRoom(code) {
    if (state.online.pollingId) window.clearInterval(state.online.pollingId);
    state.online.pollingId = window.setInterval(async () => {
      try {
        const room = await api(`/api/rooms/${encodeURIComponent(code)}`, null, "GET");
        handleRoom(room);
      } catch (error) {
        window.clearInterval(state.online.pollingId);
      }
    }, 1200);
  }

  function closeOnlineConnection() {
    if (state.online.eventSource) state.online.eventSource.close();
    if (state.online.pollingId) window.clearInterval(state.online.pollingId);
    state.online.eventSource = null;
    state.online.pollingId = null;
    state.online.room = null;
    state.online.roomCode = null;
  }

  function handleRoom(room) {
    state.online.room = room;
    state.online.roomCode = room.code;
    els.roomCodeButton.textContent = room.code;
    renderScores();

    if (room.status === "waiting") {
      showWaiting(room, room.matchmaking ? "Matchmaking" : "Stanza amici");
      return;
    }

    if (room.status === "active" && state.screen !== "gameScreen") {
      hideModal();
      startGame({
        mode: room.matchmaking ? "Match online" : "Stanza amici",
        duration: room.duration,
        scenario: room.scenario,
        seed: room.seed,
        startedAt: room.startedAt,
        online: true,
        bot: false,
        room,
      });
    }
  }

  async function syncOnlineState(finished = false) {
    if (!state.online.roomCode || !state.online.playerId) return;
    try {
      const room = await api(`/api/rooms/${encodeURIComponent(state.online.roomCode)}/state`, {
        playerId: state.online.playerId,
        name: state.playerName,
        score: state.score,
        lines: state.lines,
        finished: finished || state.finished,
      });
      state.online.room = room;
      renderScores();
    } catch (error) {
      // A dropped sync should not interrupt the local match loop.
    }
  }

  async function api(path, body, method = "POST") {
    const options = { method, headers: {} };
    if (body) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    const response = await fetch(path, options);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || response.statusText);
    }
    return response.json();
  }

  function showWaiting(room, title) {
    els.modalTitle.textContent = title;
    els.modalRoomCode.textContent = room.code || "------";
    els.modalStatus.textContent = room.status === "active"
      ? "Partita in avvio..."
      : "In attesa del secondo giocatore...";
    els.onlineModal.classList.remove("hidden");
  }

  function hideModal() {
    els.onlineModal.classList.add("hidden");
  }

  function copyRoomCode() {
    const code = state.online.roomCode;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(
      () => toast("Codice copiato."),
      () => toast(code)
    );
  }

  function ensureName() {
    if (state.playerName) return true;
    toast("Inserisci prima il nome.");
    showScreen("profileScreen");
    return false;
  }

  function getScenario(id) {
    return SCENARIOS.find((scenario) => scenario.id === id) || SCENARIOS[0];
  }

  function getPlayerId() {
    if (!state.online.playerId) {
      state.online.playerId = localStorage.getItem("gridrush:playerId") || randomToken(16);
      localStorage.setItem("gridrush:playerId", state.online.playerId);
    }
    return state.online.playerId;
  }

  function makeSeed() {
    return Math.floor(Math.random() * 2_000_000_000);
  }

  function randomToken(length) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let value = "";
    const array = new Uint32Array(length);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i += 1) value += chars[array[i] % chars.length];
      return value;
    }
    for (let i = 0; i < length; i += 1) value += chars[Math.floor(Math.random() * chars.length)];
    return value;
  }

  function normalizeShape(cells) {
    const minRow = Math.min(...cells.map(([row]) => row));
    const minCol = Math.min(...cells.map(([, col]) => col));
    return cells.map(([row, col]) => [row - minRow, col - minCol]);
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function setBlockStyle(element, palette) {
    element.style.setProperty("--block-a", palette[0]);
    element.style.setProperty("--block-b", palette[1]);
  }

  function pointToIndex(row, col) {
    return row * GRID + col;
  }

  function indexToPoint(index) {
    return { row: Math.floor(index / GRID), col: index % GRID };
  }

  function isInside(row, col) {
    return row >= 0 && row < GRID && col >= 0 && col < GRID;
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("visible");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => els.toast.classList.remove("visible"), 2200);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[char]
    ));
  }
})();
