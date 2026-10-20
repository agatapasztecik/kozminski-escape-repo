/**
 * KOZMINSKI ESCAPE: POLOWANIE NA ECTS — SILNIK GRY (js/game.js)
 * Akademia Leona Koźmińskiego (ALK) w Warszawie
 */

(function () {
  'use strict';

  // --- ELEMENTY DOM ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // HUD
  const ectsCurrentEl = document.getElementById('ects-current');
  const ectsProgressEl = document.getElementById('ects-progress-bar');
  const staminaFillEl = document.getElementById('stamina-fill');
  const staminaTextEl = document.getElementById('stamina-value-text');
  const campusStatusEl = document.getElementById('campus-status');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');

  // Dymek profesora
  const professorBubble = document.getElementById('professor-bubble');
  const professorTextEl = document.getElementById('professor-text');

  // Ekrany modalne
  const startModal = document.getElementById('start-modal');
  const gameOverModal = document.getElementById('game-over-modal');
  const victoryModal = document.getElementById('victory-modal');

  const btnStart = document.getElementById('btn-start');
  const btnRestart = document.getElementById('btn-restart');
  const btnVictoryRestart = document.getElementById('btn-victory-restart');

  const failEctsEl = document.getElementById('fail-ects');
  const failTimeEl = document.getElementById('fail-time');
  const victoryTimeEl = document.getElementById('victory-time');

  // Kontrolery dotykowe
  const touchUp = document.getElementById('touch-up');
  const touchDown = document.getElementById('touch-down');
  const touchLeft = document.getElementById('touch-left');
  const touchRight = document.getElementById('touch-right');
  const touchSprint = document.getElementById('touch-sprint');

  // --- STAŁE GRY ---
  const TARGET_ECTS = 30;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 540;

  // Cytaty profesora
  const PROFESSOR_QUOTES = [
    '„Panie Kolego, z taką frekwencją to od razu zapraszam na wrzesień!”',
    '„Gdzie jest przypis w formacie APA?! To niedopuszczalne!”',
    '„Kto powiedział, że zerówka u mnie jest formalnością?!”',
    '„Proszę natychmiast schować smartfon do plecaka!”',
    '„Termin oddania casu biznesowego minął wczoraj o 23:59!”',
    '„Nie widzę podpisu z Dziekanatu na podaniu o indywidualny tok!”',
    '„Czytał Pan sylabus przed wejściem na salę wykładową?!”',
    '„Statystyka opisowa nie wybacza braku koncentracji!”',
    '„Poprawka odbędzie się w Audytorium D-200. Punktualnie!”',
    '„Na Koźmińskim wymagamy 100% zaangażowania!”'
  ];

  // --- DEFINICJA MAPY KAMPUSU ALK ---
  // Granice i strefy (Budynki A, B, C, D oraz Zielone Patio)
  const WALLS = [
    // Zewnętrzne ściany kampusu
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 12 },
    { x: 0, y: CANVAS_HEIGHT - 12, w: CANVAS_WIDTH, h: 12 },
    { x: 0, y: 0, w: 12, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 12, y: 0, w: 12, h: CANVAS_HEIGHT },

    // Budynek D (Korytarze i Dziekanat - Lewy sektor)
    { x: 170, y: 12, w: 12, h: 180 },
    { x: 170, y: 260, w: 12, h: 268 },
    { x: 12, y: 260, w: 110, h: 12 },

    // Budynek B (Aula Główna - Górny środek)
    { x: 260, y: 140, w: 280, h: 12 },
    { x: 260, y: 12, w: 12, h: 70 },
    { x: 528, y: 12, w: 12, h: 70 },

    // Budynek C (Biblioteka & Kawiarnia - Prawy sektor)
    { x: 620, y: 12, w: 12, h: 200 },
    { x: 620, y: 280, w: 12, h: 248 },
    { x: 680, y: 380, w: 108, h: 12 },

    // Elementy Patio (obramowanie zieleni / ławki / fontanna lwa)
    { x: 370, y: 290, w: 60, h: 60 } // Cokół pomnika Lwa ALK
  ];

  // Strefy kampusu
  const CAMPUS_ZONES = [
    { name: 'Budynek D — Dziekanat & Sale Ćwiczeń', x1: 0, y1: 0, x2: 180, y2: 540 },
    { name: 'Budynek B — Aula Główna', x1: 180, y1: 0, x2: 620, y2: 160 },
    { name: 'Zielone Patio ALK — Serce Kampusu 🦁', x1: 180, y1: 160, x2: 620, y2: 440 },
    { name: 'Budynek A — Korytarz Rektorski', x1: 180, y1: 440, x2: 620, y2: 540 },
    { name: 'Budynek C — Kawiarnia & Bufet', x1: 620, y1: 0, x2: 800, y2: 240 },
    { name: 'Budynek C — Biblioteka Główna ALK', x1: 620, y1: 240, x2: 800, y2: 540 }
  ];

  // --- STAN GRY ---
  let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'
  let scoreECTS = 0;
  let gameStartTime = 0;
  let gameEndTime = 0;
  let lastTimestamp = 0;
  let bubbleTimeout = null;

  // Wejście klawiatury i dotyku
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false
  };

  // --- GRACZ (STUDENT) ---
  const player = {
    x: 90,
    y: 130,
    size: 24,
    speed: 160,
    sprintSpeed: 275,
    stamina: 100,
    maxStamina: 100,
    isSprinting: false,
    facing: 'right', // 'up' | 'down' | 'left' | 'right'
    walkFrame: 0,
    powerupTimer: 0, // Czas trwania bluzy ALK

    reset() {
      this.x = 80;
      this.y = 120;
      this.stamina = 100;
      this.isSprinting = false;
      this.facing = 'right';
      this.walkFrame = 0;
      this.powerupTimer = 0;
    }
  };

  // --- PRZECIWNIK (PROF. EGZAMINATOR) ---
  const examiner = {
    x: 700,
    y: 440,
    size: 26,
    speed: 125,
    alertSpeed: 172,
    facing: 'left',
    walkFrame: 0,
    alerted: false,
    quoteCooldown: 0,
    patrolIndex: 0,
    patrolPoints: [
      { x: 700, y: 440 },
      { x: 700, y: 100 },
      { x: 400, y: 80 },
      { x: 400, y: 220 },
      { x: 230, y: 220 },
      { x: 90, y: 350 },
      { x: 230, y: 480 },
      { x: 400, y: 480 },
      { x: 550, y: 350 }
    ],

    reset() {
      this.x = 700;
      this.y = 440;
      this.patrolIndex = 0;
      this.alerted = false;
      this.quoteCooldown = 2;
    }
  };

  // --- PRZEDMIOTY (PICKUPS) ---
  let items = [];

  // Miejsca respawnu przedmiotów na kampusie
  const SPAWN_SPOTS = [
    { x: 60, y: 80, zone: 'Budynek D' },
    { x: 60, y: 340, zone: 'Budynek D' },
    { x: 120, y: 460, zone: 'Budynek D' },
    { x: 220, y: 80, zone: 'Budynek B' },
    { x: 380, y: 80, zone: 'Aula B' },
    { x: 480, y: 80, zone: 'Aula B' },
    { x: 250, y: 230, zone: 'Patio' },
    { x: 500, y: 230, zone: 'Patio' },
    { x: 300, y: 400, zone: 'Patio' },
    { x: 480, y: 400, zone: 'Patio' },
    { x: 400, y: 480, zone: 'Budynek A' },
    { x: 710, y: 80, zone: 'Kawiarnia' },
    { x: 740, y: 160, zone: 'Kawiarnia' },
    { x: 680, y: 310, zone: 'Biblioteka' },
    { x: 740, y: 460, zone: 'Biblioteka' },
    { x: 310, y: 290, zone: 'Patio' },
    { x: 490, y: 290, zone: 'Patio' }
  ];

  function seedItems() {
    items = [];
    // Rozsiej przedmioty ECTS
    SPAWN_SPOTS.forEach((spot, idx) => {
      let type = 'ects_1';
      let value = 1;

      if (idx % 4 === 0) {
        type = 'ects_3'; // Duży podręcznik
        value = 3;
      } else if (idx % 2 === 0) {
        type = 'ects_2'; // Zeszyt ćwiczeń
        value = 2;
      }

      // Kawa w bufecie
      if (spot.zone === 'Kawiarnia' && idx % 2 === 1) {
        type = 'coffee';
        value = 0;
      } else if (idx === 7) {
        type = 'merch'; // Koźmiński hoodie
        value = 0;
      }

      items.push({
        x: spot.x,
        y: spot.y,
        type: type,
        value: value,
        size: 16,
        collected: false,
        pulseAngle: Math.random() * Math.PI * 2
      });
    });
  }

  // --- POMOCNICZE SPRAWDZANIE KOLIZJI ---
  function checkCollision(x, y, size) {
    const half = size / 2;
    const box = {
      left: x - half,
      right: x + half,
      top: y - half,
      bottom: y + half
    };

    for (const wall of WALLS) {
      if (
        box.right > wall.x &&
        box.left < wall.x + wall.w &&
        box.bottom > wall.y &&
        box.top < wall.y + wall.h
      ) {
        return true;
      }
    }
    return false;
  }

  // Odległość między dwoma punktami
  function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  // Formatowanie czasu MM:SS
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Pokazanie dymka profesora
  function showProfessorQuote(text) {
    if (!professorBubble || !professorTextEl) return;
    professorTextEl.textContent = text;
    professorBubble.classList.remove('hidden');

    if (window.SoundSystem) {
      window.SoundSystem.play('freeze');
    }

    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(() => {
      professorBubble.classList.add('hidden');
    }, 4500);
  }

  // Aktualizacja nazwy strefy w HUD
  function updateCampusZoneHUD() {
    for (const zone of CAMPUS_ZONES) {
      if (
        player.x >= zone.x1 &&
        player.x < zone.x2 &&
        player.y >= zone.y1 &&
        player.y < zone.y2
      ) {
        if (campusStatusEl && campusStatusEl.textContent !== zone.name) {
          campusStatusEl.textContent = zone.name;
        }
        break;
      }
    }
  }

  // Aktualizacja HUD ECTS i Staminy
  function updateHUD() {
    if (ectsCurrentEl) {
      ectsCurrentEl.textContent = scoreECTS;
    }
    if (ectsProgressEl) {
      const pct = Math.min(100, Math.round((scoreECTS / TARGET_ECTS) * 100));
      ectsProgressEl.style.width = `${pct}%`;
    }
    if (staminaFillEl) {
      const staminaPct = Math.round((player.stamina / player.maxStamina) * 100);
      staminaFillEl.style.width = `${staminaPct}%`;
      if (staminaPct <= 15) {
        staminaFillEl.classList.add('exhausted');
      } else {
        staminaFillEl.classList.remove('exhausted');
      }
    }
    if (staminaTextEl) {
      staminaTextEl.textContent = `${Math.round(player.stamina)}%`;
    }
  }

  // --- STEROWANIE ---
  function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.up = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.down = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'Space':
          keys.sprint = true;
          break;
        case 'KeyM':
          if (window.GameAudio) window.GameAudio.toggleMute();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.up = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.down = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'Space':
          keys.sprint = false;
          break;
      }
    });

    // Wirtualne przyciski dotykowe
    const bindTouch = (elem, keyName) => {
      if (!elem) return;
      const start = (e) => {
        e.preventDefault();
        keys[keyName] = true;
        elem.classList.add('active');
      };
      const end = (e) => {
        e.preventDefault();
        keys[keyName] = false;
        elem.classList.remove('active');
      };

      elem.addEventListener('touchstart', start, { passive: false });
      elem.addEventListener('touchend', end, { passive: false });
      elem.addEventListener('touchcancel', end, { passive: false });
      elem.addEventListener('mousedown', start);
      elem.addEventListener('mouseup', end);
      elem.addEventListener('mouseleave', end);
    };

    bindTouch(touchUp, 'up');
    bindTouch(touchDown, 'down');
    bindTouch(touchLeft, 'left');
    bindTouch(touchRight, 'right');
    bindTouch(touchSprint, 'sprint');

    // Dźwięk przycisk
    if (btnAudioToggle) {
      btnAudioToggle.addEventListener('click', () => {
        if (window.SoundSystem) window.SoundSystem.toggleMute();
      });
    }

    // Przyciski startu i restartu
    if (btnStart) {
      btnStart.addEventListener('click', startGame);
    }
    if (btnRestart) {
      btnRestart.addEventListener('click', startGame);
    }
    if (btnVictoryRestart) {
      btnVictoryRestart.addEventListener('click', startGame);
    }
  }

  // --- LOGIKA GRY ---
  function startGame() {
    if (window.SoundSystem) {
      window.SoundSystem.init();
    }

    startModal.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    victoryModal.classList.add('hidden');

    scoreECTS = 0;
    player.reset();
    examiner.reset();
    seedItems();
    updateHUD();

    gameStartTime = performance.now();
    gameState = 'PLAYING';

    showProfessorQuote('„Zaczynamy egzamin! Zobaczymy, czy znasz materiał!”');
  }

  function triggerGameOver() {
    gameState = 'GAMEOVER';
    gameEndTime = performance.now();
    const duration = (gameEndTime - gameStartTime) / 1000;

    if (failEctsEl) failEctsEl.textContent = `${scoreECTS} / ${TARGET_ECTS}`;
    if (failTimeEl) failTimeEl.textContent = formatTime(duration);

    if (window.SoundSystem) {
      window.SoundSystem.play('hit');
    }

    showProfessorQuote('„Zaliczam zero punktów! Widzimy się w kampanii wrześniowej!”');
    setTimeout(() => {
      gameOverModal.classList.remove('hidden');
    }, 600);
  }

  function triggerVictory() {
    gameState = 'VICTORY';
    gameEndTime = performance.now();
    const duration = (gameEndTime - gameStartTime) / 1000;

    if (victoryTimeEl) victoryTimeEl.textContent = formatTime(duration);

    if (window.SoundSystem) {
      window.SoundSystem.play('win');
    }

    setTimeout(() => {
      victoryModal.classList.remove('hidden');
    }, 600);
  }

  // --- AKTUALIZACJA POZYCJI I STANU (TICK) ---
  function update(dt) {
    if (gameState !== 'PLAYING') return;

    // 1. Ruch gracza
    let dx = 0;
    let dy = 0;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    // Normalizacja wektora po przekątnej
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    const isMoving = dx !== 0 || dy !== 0;

    // Aktualizacja kierunku patrzenia
    if (dx > 0) player.facing = 'right';
    else if (dx < 0) player.facing = 'left';
    else if (dy < 0) player.facing = 'up';
    else if (dy > 0) player.facing = 'down';

    // Obsługa sprintu i staminy
    player.isSprinting = keys.sprint && isMoving && player.stamina > 5;
    let currentSpeed = player.isSprinting ? player.sprintSpeed : player.speed;

    if (player.powerupTimer > 0) {
      player.powerupTimer -= dt;
      currentSpeed *= 1.25; // Bonus prędkości z bluzy ALK
    }

    if (player.isSprinting) {
      player.stamina = Math.max(0, player.stamina - dt * 32);
    } else {
      player.stamina = Math.min(player.maxStamina, player.stamina + dt * 20);
    }

    // Przesunięcie gracza z kolizją na osiach X i Y niezależnie (ślizganie po ścianach)
    if (isMoving) {
      player.walkFrame += dt * (player.isSprinting ? 14 : 9);

      const nextX = player.x + dx * currentSpeed * dt;
      if (!checkCollision(nextX, player.y, player.size)) {
        player.x = nextX;
      }

      const nextY = player.y + dy * currentSpeed * dt;
      if (!checkCollision(player.x, nextY, player.size)) {
        player.y = nextY;
      }
    }

    // 2. Kolizje z przedmiotami (ECTS, Kawa, Merch)
    items.forEach((item) => {
      if (item.collected) return;
      item.pulseAngle += dt * 3;

      const dist = getDistance(player.x, player.y, item.x, item.y);
      if (dist < player.size / 2 + item.size / 2) {
        item.collected = true;

        if (item.type.startsWith('ects')) {
          scoreECTS += item.value;
          if (window.SoundSystem) window.SoundSystem.play('ects');

          // Sprawdzenie zwycięstwa
          if (scoreECTS >= TARGET_ECTS) {
            scoreECTS = TARGET_ECTS;
            updateHUD();
            triggerVictory();
            return;
          }
        } else if (item.type === 'coffee') {
          player.stamina = player.maxStamina;
          if (window.SoundSystem) window.SoundSystem.play('coffee');
        } else if (item.type === 'merch') {
          player.powerupTimer = 8; // 8 sekund turbo
          if (window.SoundSystem) window.SoundSystem.play('shield');
        }

        updateHUD();
      }
    });

    // Odradzanie przedmiotów jeśli na mapie zostało ich mało
    const remainingECTS = items.filter((i) => !i.collected && i.type.startsWith('ects'));
    if (remainingECTS.length < 5 && scoreECTS < TARGET_ECTS) {
      const freeSpots = SPAWN_SPOTS.filter(
        (sp) => getDistance(player.x, player.y, sp.x, sp.y) > 120
      );
      if (freeSpots.length > 0) {
        const spot = freeSpots[Math.floor(Math.random() * freeSpots.length)];
        items.push({
          x: spot.x,
          y: spot.y,
          type: Math.random() > 0.4 ? 'ects_2' : 'ects_1',
          value: Math.random() > 0.4 ? 2 : 1,
          size: 16,
          collected: false,
          pulseAngle: 0
        });
      }
    }

    // 3. AI Profesora (Patrol & Chase)
    const distToPlayer = getDistance(examiner.x, examiner.y, player.x, player.y);
    const detectionRange = 175;

    let targetX = 0;
    let targetY = 0;

    if (distToPlayer < detectionRange) {
      // Wykrycie gracza - pościg!
      if (!examiner.alerted) {
        examiner.alerted = true;
        showProfessorQuote(
          PROFESSOR_QUOTES[Math.floor(Math.random() * PROFESSOR_QUOTES.length)]
        );
      }
      targetX = player.x;
      targetY = player.y;
    } else {
      examiner.alerted = false;
      const targetPoint = examiner.patrolPoints[examiner.patrolIndex];
      targetX = targetPoint.x;
      targetY = targetPoint.y;

      if (getDistance(examiner.x, examiner.y, targetX, targetY) < 18) {
        examiner.patrolIndex =
          (examiner.patrolIndex + 1) % examiner.patrolPoints.length;
      }
    }

    // Ruch profesora
    const exAngle = Math.atan2(targetY - examiner.y, targetX - examiner.x);
    const exSpeed = examiner.alerted ? examiner.alertSpeed : examiner.speed;

    const exDx = Math.cos(exAngle) * exSpeed * dt;
    const exDy = Math.sin(exAngle) * exSpeed * dt;

    if (Math.abs(exDx) > Math.abs(exDy)) {
      examiner.facing = exDx > 0 ? 'right' : 'left';
    } else {
      examiner.facing = exDy > 0 ? 'down' : 'up';
    }
    examiner.walkFrame += dt * 8;

    // Przesunięcie profesora (z prostą kolizją)
    const exNextX = examiner.x + exDx;
    if (!checkCollision(exNextX, examiner.y, examiner.size)) {
      examiner.x = exNextX;
    }
    const exNextY = examiner.y + exDy;
    if (!checkCollision(examiner.x, exNextY, examiner.size)) {
      examiner.y = exNextY;
    }

    // Kolizja profesora ze studentem -> Przegrana!
    if (distToPlayer < (player.size + examiner.size) * 0.45) {
      triggerGameOver();
      return;
    }

    // Losowe cytaty profesora co jakiś czas
    examiner.quoteCooldown -= dt;
    if (examiner.quoteCooldown <= 0) {
      if (Math.random() < 0.3) {
        showProfessorQuote(
          PROFESSOR_QUOTES[Math.floor(Math.random() * PROFESSOR_QUOTES.length)]
        );
      }
      examiner.quoteCooldown = 12 + Math.random() * 8;
    }

    // Aktualizacja strefy w HUD
    updateCampusZoneHUD();
  }

  // --- RENDEROWANIE GRAFIKI 2D ---
  function draw() {
    // Tło kampusu
    ctx.fillStyle = '#06111f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Korytarze i posadzka (płytki kampusu)
    drawFloorTiles();

    // Zielone Patio ALK
    drawPatioArea();

    // Ściany i architektura
    drawWallsAndRooms();

    // Przedmioty do zebrania
    drawItems();

    // Sylwetka Profesora
    drawExaminer();

    // Sylwetka Gracza (Studenta)
    drawPlayer();
  }

  // Rysowanie płytek podłogi
  function drawFloorTiles() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const tileSize = 40;
    for (let x = 0; x < CANVAS_WIDTH; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  // Zielone Patio
  function drawPatioArea() {
    // Zielony trawnik
    ctx.fillStyle = '#0f3d26';
    ctx.fillRect(190, 160, 420, 270);

    // Ścieżki spacerowe na Patio
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(190, 280, 420, 30); // Pozioma alejka
    ctx.fillRect(385, 160, 30, 270); // Pionowa alejka

    // Drzewka ozdobne na Patio
    const trees = [
      { x: 230, y: 200 },
      { x: 570, y: 200 },
      { x: 230, y: 390 },
      { x: 570, y: 390 }
    ];

    trees.forEach((tree) => {
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#065f46';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
    });

    // Cokół i Pomnik Lwa Koźmińskiego w centrum
    ctx.fillStyle = '#334155';
    ctx.fillRect(370, 275, 60, 40);
    ctx.fillStyle = '#c8963e';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🦁', 400, 302);

    ctx.font = '9px Outfit, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('LEW ALK', 400, 323);
  }

  // Rysowanie ścian i etykiet sal
  function drawWallsAndRooms() {
    // Ściany
    ctx.fillStyle = '#1a365d';
    ctx.strokeStyle = '#2b6cb0';
    ctx.lineWidth = 2;

    WALLS.forEach((w) => {
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    });

    // Napisy na salach i strefach
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'left';

    // Budynek D
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('DZIEKANAT D', 30, 40);
    ctx.fillStyle = '#64748b';
    ctx.fillText('Sale D-101 .. D-108', 30, 290);

    // Aula B
    ctx.fillStyle = '#fde68a';
    ctx.fillText('AULA GŁÓWNA B', 350, 40);

    // Kawiarnia ALK
    ctx.fillStyle = '#fed7aa';
    ctx.fillText('☕ KAWIARNIA ALK', 650, 40);

    // Biblioteka
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('📖 BIBLIOTEKA ALK', 650, 310);
  }

  // Rysowanie przedmiotów
  function drawItems() {
    items.forEach((item) => {
      if (item.collected) return;

      const floatY = Math.sin(item.pulseAngle) * 3;

      ctx.save();
      ctx.translate(item.x, item.y + floatY);

      if (item.type.startsWith('ects')) {
        // ECTS Book / Notebook
        ctx.fillStyle = item.value === 3 ? '#e5a823' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📘', 0, 0);

        // Liczba ECTS
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`+${item.value}`, 0, 13);
      } else if (item.type === 'coffee') {
        // Kawa Espresso
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☕', 0, 0);
      } else if (item.type === 'merch') {
        // Czapka / Bluza ALK
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧢', 0, 0);
      }

      ctx.restore();
    });
  }

  // Rysowanie studenta
  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Aura speed boost (jeśli aktywny merch)
    if (player.powerupTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(229, 168, 35, 0.3)';
      ctx.fill();
    }

    // Cień postaci
    ctx.beginPath();
    ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();

    // Plecak Koźmińskiego (niebieski)
    ctx.fillStyle = '#002d62';
    if (player.facing === 'down') {
      ctx.fillRect(-8, -12, 16, 8);
    } else if (player.facing === 'up') {
      ctx.fillRect(-8, -4, 16, 12);
    } else if (player.facing === 'left') {
      ctx.fillRect(4, -8, 7, 14);
    } else if (player.facing === 'right') {
      ctx.fillRect(-11, -8, 7, 14);
    }

    // Tułów (bluza studenta)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-7, -6, 14, 14);

    // Głowa
    ctx.beginPath();
    ctx.arc(0, -11, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fcd34d'; // karnacja
    ctx.fill();

    // Włosy / czapka
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, -14, 7, Math.PI, Math.PI * 2);
    ctx.fill();

    // Nogi / animacja chodu
    const legOffset = Math.sin(player.walkFrame) * 4;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-5, 8, 4, 7 + legOffset);
    ctx.fillRect(1, 8, 4, 7 - legOffset);

    ctx.restore();
  }

  // Rysowanie profesora
  function drawExaminer() {
    ctx.save();
    ctx.translate(examiner.x, examiner.y);

    // Czerwony wykrzyknik i zasięg jeśli zaalarmowany
    if (examiner.alerted) {
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();

      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText('❗', 0, -26);
    }

    // Cień
    ctx.beginPath();
    ctx.ellipse(0, 13, 11, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();

    // Garnitur / Marynarka
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8, -7, 16, 16);

    // Czerwony krawat
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-2, -5, 4, 8);

    // Teczka z arkuszami ocen
    ctx.fillStyle = '#78350f';
    if (examiner.facing === 'left') {
      ctx.fillRect(-14, 0, 6, 8);
    } else {
      ctx.fillRect(8, 0, 6, 8);
    }

    // Głowa
    ctx.beginPath();
    ctx.arc(0, -12, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fed7aa';
    ctx.fill();

    // Siwe włosy
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, -15, 7.5, Math.PI, Math.PI * 2);
    ctx.fill();

    // Okulary
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, -13, 8, 3);

    // Nogi
    const exLegOffset = Math.sin(examiner.walkFrame) * 4;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 9, 4, 7 + exLegOffset);
    ctx.fillRect(2, 9, 4, 7 - exLegOffset);

    ctx.restore();
  }

  // --- GŁÓWNA PĘTLA GRY ---
  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
  }

  // --- INICJALIZACJA PRZY STARCIE STRONY ---
  window.addEventListener('DOMContentLoaded', () => {
    setupInputHandlers();
    seedItems();
    updateHUD();
    requestAnimationFrame(gameLoop);
  });
})();
