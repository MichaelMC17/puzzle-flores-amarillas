document.addEventListener('DOMContentLoaded', () => {
  createFallingPetals();

  // Pantallas
  const welcomeScreen = document.getElementById('welcome-screen');
  const levelSelectionScreen = document.getElementById('level-selection-screen');
  const gameScreen = document.getElementById('game-screen');

  // Elementos de la pantalla de bienvenida interactiva
  const tapFlowerBtn = document.getElementById('tapFlowerBtn');
  const tapPrompt = document.getElementById('tapPrompt');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPercentText = document.getElementById('loaderPercentText');

  // CONTROL DE SESIÓN: Si ya tocaron la flor antes en esta visita, saltar directo al carrusel
  const hasPassedWelcome = sessionStorage.getItem('hasPassedWelcome');
  if (hasPassedWelcome === 'true') {
    welcomeScreen.classList.remove('active');
    levelSelectionScreen.classList.add('active');
  }

  let currentProgress = 0;
  const clickSteps = [
    { target: 17, text: "Otra vez..." },
    { target: 33, text: "Algo se está encendiendo..." },
    { target: 50, text: "Sigue, que ya florece..." },
    { target: 67, text: "Un poquito más..." },
    { target: 83, text: "¡No pares ahora!" },
    { target: 100, text: "¡La última vez! 🌻" }
  ];
  let stepIndex = 0;

  // Mecánica: Tocar la flor para cargar
  tapFlowerBtn.addEventListener('click', () => {
    if (currentProgress >= 100) return;

    if (navigator.vibrate) navigator.vibrate(30);

    const step = clickSteps[stepIndex];
    currentProgress = step.target;
    stepIndex++;

    loaderFill.style.width = `${currentProgress}%`;
    loaderPercentText.innerText = `${currentProgress}%`;

    tapFlowerBtn.querySelector('.interactive-flower').style.transform = 'scale(1.25)';
    setTimeout(() => {
      tapFlowerBtn.querySelector('.interactive-flower').style.transform = '';
    }, 120);

    if (currentProgress < 100) {
      tapPrompt.innerText = step.text;
    } else {
      tapPrompt.innerText = "¡Listo! 💛";
      
      // Guardar que ya completó la bienvenida
      sessionStorage.setItem('hasPassedWelcome', 'true');

      setTimeout(() => {
        welcomeScreen.classList.remove('active');
        levelSelectionScreen.classList.add('active');
      }, 550);
    }
  });

  // Elementos del Puzzle
  const levelCards = document.querySelectorAll('.level-card-slide');
  const btnBackToLevels = document.getElementById('btnBackToLevels');
  const boardGhostGuide = document.getElementById('boardGhostGuide');
  const btnToggleGhost = document.getElementById('btnToggleGhost');
  const currentPieceSlot = document.getElementById('currentPieceSlot');
  const puzzleBoard = document.getElementById('puzzleBoard');
  const levelTitleBadge = document.getElementById('levelTitleBadge');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressLabel = document.getElementById('progressLabel');

  const winModal = document.getElementById('winModal');
  const completedPhoto = document.getElementById('completedPhoto');
  const winMessageText = document.getElementById('winMessageText');
  const btnNextLevel = document.getElementById('btnNextLevel');

  let currentLevelData = null;
  let remainingPieces = [];
  let activePiece = null;
  let totalPiecesCount = 9;

  // PERSISTENCIA DE NIVELES: Cargar niveles desbloqueados guardados
  let savedUnlocked = localStorage.getItem('unlockedLevels');
  let unlockedLevels = savedUnlocked ? JSON.parse(savedUnlocked) : [1];

  // Aplicar visualmente los candados desbloqueados al cargar
  unlockedLevels.forEach(id => {
    const card = document.querySelector(`.level-card-slide[data-id="${id}"]`);
    if (card) {
      card.classList.remove('locked');
      const lock = card.querySelector('.lock-overlay');
      if (lock) lock.remove();
    }
  });

  btnToggleGhost.addEventListener('click', () => {
    boardGhostGuide.classList.toggle('hidden');
  });

  // 1. Selección de Nivel
  levelCards.forEach(card => {
    card.addEventListener('click', () => {
      const levelId = parseInt(card.getAttribute('data-id'));
      if (!unlockedLevels.includes(levelId)) return;

      currentLevelData = {
        id: levelId,
        title: card.getAttribute('data-title'),
        img: card.getAttribute('data-img'),
        grid: parseInt(card.getAttribute('data-grid')),
        msg: card.getAttribute('data-msg')
      };

      startLevel(currentLevelData);
    });
  });

  btnBackToLevels.addEventListener('click', () => {
    gameScreen.classList.remove('active');
    levelSelectionScreen.classList.add('active');
  });

  // 2. Iniciar Tablero
  function startLevel(lvl) {
    levelSelectionScreen.classList.remove('active');
    gameScreen.classList.add('active');

    levelTitleBadge.innerText = `Nivel ${lvl.id}: ${lvl.title}`;
    boardGhostGuide.src = lvl.img;
    boardGhostGuide.classList.remove('hidden');

    const gridSize = lvl.grid;
    puzzleBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    puzzleBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    puzzleBoard.innerHTML = '';

    totalPiecesCount = gridSize * gridSize;
    remainingPieces = [];

    for (let index = 0; index < totalPiecesCount; index++) {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      const cell = document.createElement('div');
      cell.classList.add('board-cell');
      cell.dataset.index = index;
      cell.addEventListener('click', () => handleCellClick(index, cell));
      puzzleBoard.appendChild(cell);

      remainingPieces.push({
        index: index,
        row: row,
        col: col,
        gridSize: gridSize,
        img: lvl.img
      });
    }

    remainingPieces.sort(() => Math.random() - 0.5);
    updateProgress();
    nextPiece();
  }

  function updateProgress() {
    const placed = totalPiecesCount - remainingPieces.length - (activePiece ? 1 : 0);
    const percent = (placed / totalPiecesCount) * 100;
    progressBarFill.style.width = `${percent}%`;
    progressLabel.innerText = `${placed} / ${totalPiecesCount} piezas`;
  }

  function nextPiece() {
    if (remainingPieces.length === 0) {
      activePiece = null;
      updateProgress();
      handleGameWin();
      return;
    }

    activePiece = remainingPieces.pop();
    updateProgress();

    const bgWidth = activePiece.gridSize * 100;
    const bgHeight = activePiece.gridSize * 100;
    const posX = (activePiece.col / (activePiece.gridSize - 1)) * 100;
    const posY = (activePiece.row / (activePiece.gridSize - 1)) * 100;

    currentPieceSlot.style.backgroundImage = `url('${activePiece.img}')`;
    currentPieceSlot.style.backgroundSize = `${bgWidth}% ${bgHeight}%`;
    currentPieceSlot.style.backgroundPosition = `${posX}% ${posY}%`;
    currentPieceSlot.style.display = 'block';
  }

  function handleCellClick(clickedIndex, cellElement) {
    if (!activePiece || cellElement.classList.contains('filled')) return;

    if (clickedIndex === activePiece.index) {
      const bgWidth = activePiece.gridSize * 100;
      const bgHeight = activePiece.gridSize * 100;
      const posX = (activePiece.col / (activePiece.gridSize - 1)) * 100;
      const posY = (activePiece.row / (activePiece.gridSize - 1)) * 100;

      cellElement.style.backgroundImage = `url('${activePiece.img}')`;
      cellElement.style.backgroundSize = `${bgWidth}% ${bgHeight}%`;
      cellElement.style.backgroundPosition = `${posX}% ${posY}%`;
      cellElement.classList.add('filled');

      if (navigator.vibrate) navigator.vibrate(40);
      nextPiece();
    } else {
      cellElement.classList.add('cell-error');
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

      setTimeout(() => {
        cellElement.classList.remove('cell-error');
      }, 350);
    }
  }

  function handleGameWin() {
    currentPieceSlot.style.display = 'none';

    if (typeof confetti === 'function') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#facc15', '#fef08a', '#eab308', '#ca8a04', '#ffffff']
      });
    }

    completedPhoto.src = currentLevelData.img;
    winMessageText.innerText = currentLevelData.msg;
    
    setTimeout(() => {
      winModal.classList.add('show');
    }, 400);

    const nextLevelId = currentLevelData.id + 1;
    if (!unlockedLevels.includes(nextLevelId)) {
      unlockedLevels.push(nextLevelId);
      // Guardar nuevo nivel desbloqueado
      localStorage.setItem('unlockedLevels', JSON.stringify(unlockedLevels));

      const nextCard = document.querySelector(`.level-card-slide[data-id="${nextLevelId}"]`);
      if (nextCard) {
        nextCard.classList.remove('locked');
        const lock = nextCard.querySelector('.lock-overlay');
        if (lock) lock.remove();
      }
    }
  }

  btnNextLevel.addEventListener('click', () => {
    winModal.classList.remove('show');
    gameScreen.classList.remove('active');
    levelSelectionScreen.classList.add('active');
  });

  function createFallingPetals() {
    const container = document.getElementById('petalsContainer');
    if (!container) return;

    const icons = ['🌻', '🌼', '✨', '💛'];
    const count = 18;

    for (let i = 0; i < count; i++) {
      const petal = document.createElement('div');
      petal.classList.add('petal');
      petal.innerText = icons[Math.floor(Math.random() * icons.length)];
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.animationDuration = `${5 + Math.random() * 7}s`;
      petal.style.animationDelay = `${Math.random() * 5}s`;
      petal.style.fontSize = `${14 + Math.random() * 16}px`;
      container.appendChild(petal);
    }
  }
});