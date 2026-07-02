const introScreen = document.getElementById('intro-screen');
const gameMenu = document.getElementById('game-menu');
const gameScreen = document.getElementById('game-screen');
const playBtn = document.getElementById('playBtn');
const menuBackBtn = document.getElementById('menuBackBtn');
const backBtn = document.getElementById('backBtn');
const startGameBtn = document.getElementById('startGameBtn');
const resetGameBtn = document.getElementById('resetGameBtn');
const gameTitle = document.getElementById('gameTitle');
const gameDescription = document.getElementById('gameDescription');
const gameStats = document.getElementById('gameStats');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');

const games = {
  paperio: {
    id: 'paperio',
    title: 'Paper IO Battle Royale',
    description: 'Drive your trail, survive the arena, and outlast other players with fast reflexes.',
    time: 60,
  },
  dodge: {
    id: 'dodge',
    title: 'Dodge Arena',
    description: 'Move left and right to avoid falling obstacles while your score climbs.',
    time: 60,
  },
  clicker: {
    id: 'clicker',
    title: 'Click Survival',
    description: 'Click the moving target as many times as you can before time runs out.',
    time: 20,
  },
};

let currentGame = null;
let gameState = {};
let keys = {};
let lastFrameTime = 0;
let animationFrame = null;

function showScreen(screen) {
  introScreen.classList.remove('active-screen');
  gameMenu.classList.remove('active-screen');
  gameScreen.classList.remove('active-screen');
  screen.classList.add('active-screen');
}

function setupGame(gameId) {
  currentGame = games[gameId];
  gameTitle.textContent = currentGame.title;
  gameDescription.textContent = currentGame.description;
  gameState = {
    running: false,
    score: 0,
    time: currentGame.time,
    timer: currentGame.time,
    frames: 0,
    lost: false,
    player: { x: 380, y: 210, size: 14, dx: 4, dy: 0, trail: [] },
    direction: 'right',
    particles: Array.from({ length: 18 }, () => ({
      x: getRandom(0, gameCanvas.width),
      y: getRandom(0, gameCanvas.height),
      radius: getRandom(1.5, 3.5),
      alpha: getRandom(0.12, 0.28),
      drift: getRandom(0.12, 0.32),
    })),
    obstacles: [],
    target: { x: 120, y: 120, radius: 22 },
    jump: { vy: 0, onGround: true },
    paddle: { x: 340, width: 120 },
    ball: { x: 380, y: 260, vx: 4, vy: -4, radius: 10 },
    bricks: [],
  };

  if (gameId === 'breaker') {
    const rows = 4;
    const cols = 8;
    const brickWidth = 80;
    const brickHeight = 18;
    gameState.bricks = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        gameState.bricks.push({
          x: 10 + c * (brickWidth + 6),
          y: 20 + r * (brickHeight + 6),
          width: brickWidth,
          height: brickHeight,
          alive: true,
        });
      }
    }
  }

  renderGame();
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function hasTrailCollision(player) {
  return gameState.trail.some((point, index) => {
    if (index > gameState.trail.length - 16) return false;
    const distance = Math.hypot(player.x - point.x, player.y - point.y);
    return distance < player.size * 1.2;
  });
}

function startGame() {
  if (!currentGame || gameState.running) return;
  gameState.running = true;
  gameState.lost = false;
  lastFrameTime = performance.now();
  if (!animationFrame) {
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

function resetGame() {
  if (!currentGame) return;
  setupGame(currentGame.id);
}

function endGame(message) {
  gameState.running = false;
  gameState.lost = true;
  gameStats.textContent = `${message} Score: ${gameState.score}`;
}

function updateGame(delta) {
  if (!gameState.running || gameState.lost) return;
  gameState.frames += 1;

  if (currentGame.id === 'paperio') {
      const player = gameState.player;

      if (keys.ArrowUp) {
        player.dx = 0;
        player.dy = -4;
        gameState.direction = 'up';
      }
      if (keys.ArrowDown) {
        player.dx = 0;
        player.dy = 4;
        gameState.direction = 'down';
      }
      if (keys.ArrowLeft) {
        player.dx = -4;
        player.dy = 0;
        gameState.direction = 'left';
      }
      if (keys.ArrowRight) {
        player.dx = 4;
        player.dy = 0;
        gameState.direction = 'right';
      }

      player.x += player.dx;
      player.y += player.dy;
      gameState.trail.push({ x: player.x, y: player.y });
      if (gameState.trail.length > 140) {
        gameState.trail.shift();
      }

      if (player.x < 10 || player.x > gameCanvas.width - 10 || player.y < 10 || player.y > gameCanvas.height - 10) {
        endGame('You crashed the trail!');
      }

      if (hasTrailCollision(player)) {
        endGame('You crossed your own trail!');
      }

      gameState.particles.forEach((particle) => {
        particle.x += particle.drift;
        if (particle.x > gameCanvas.width + 10) {
          particle.x = -10;
        }
      });
    gameState.score = Math.max(0, gameState.trail.length - 20);
  }

  if (currentGame.id === 'dodge') {
    if (keys.ArrowLeft) {
      gameState.player.x -= 5;
    }
    if (keys.ArrowRight) {
      gameState.player.x += 5;
    }
    gameState.player.x = Math.max(10, Math.min(gameCanvas.width - 30, gameState.player.x));

    if (gameState.frames % 45 === 0) {
      gameState.obstacles.push({
        x: getRandom(20, gameCanvas.width - 40),
        y: -30,
        size: getRandom(22, 40),
        speed: getRandom(2.5, 5),
      });
    }

    gameState.obstacles.forEach((obstacle) => {
      obstacle.y += obstacle.speed;
    });
    gameState.obstacles = gameState.obstacles.filter((o) => o.y < gameCanvas.height + 40);

    const playerRect = { x: gameState.player.x, y: gameCanvas.height - 40, width: 30, height: 20 };
    if (gameState.obstacles.some((o) => o.x < playerRect.x + playerRect.width && o.x + o.size > playerRect.x && o.y < playerRect.y + playerRect.height && o.y + o.size > playerRect.y)) {
      endGame('You were hit!');
    }
    gameState.score += 0.05 * delta;
  }

  if (currentGame.id === 'clicker') {
    gameState.score = Math.max(0, gameState.score);
  }

  if (currentGame.id === 'space') {
    const jump = gameState.jump;
    if (keys.ArrowUp || keys.Space) {
      if (jump.onGround) {
        jump.vy = -10;
        jump.onGround = false;
      }
    }
    jump.vy += 0.5;
    gameState.player.y += jump.vy;
    if (gameState.player.y >= gameCanvas.height - 40) {
      gameState.player.y = gameCanvas.height - 40;
      jump.vy = 0;
      jump.onGround = true;
    }

    if (gameState.frames % 60 === 0) {
      gameState.obstacles.push({ x: gameCanvas.width + 20, y: gameCanvas.height - 40, width: 20, height: 30, speed: 4 + gameState.frames / 800 });
    }

    gameState.obstacles.forEach((obstacle) => {
      obstacle.x -= obstacle.speed;
    });
    gameState.obstacles = gameState.obstacles.filter((o) => o.x > -50);

    if (gameState.obstacles.some((o) => o.x < gameState.player.x + 20 && o.x + o.width > gameState.player.x && o.y < gameState.player.y + 20 && o.y + o.height > gameState.player.y)) {
      endGame('Asteroid impact!');
    }
    gameState.score += 0.08 * delta;
  }

  if (currentGame.id === 'breaker') {
    if (keys.ArrowLeft) {
      gameState.paddle.x -= 8;
    }
    if (keys.ArrowRight) {
      gameState.paddle.x += 8;
    }
    gameState.paddle.x = Math.max(10, Math.min(gameCanvas.width - gameState.paddle.width - 10, gameState.paddle.x));

    const ball = gameState.ball;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x < 10 || ball.x > gameCanvas.width - 10) {
      ball.vx *= -1;
    }
    if (ball.y < 10) {
      ball.vy *= -1;
    }

    const paddleRect = { x: gameState.paddle.x, y: gameCanvas.height - 30, width: gameState.paddle.width, height: 10 };
    if (ball.x > paddleRect.x && ball.x < paddleRect.x + paddleRect.width && ball.y + ball.radius > paddleRect.y) {
      ball.vy *= -1;
      ball.y = paddleRect.y - ball.radius;
    }

    gameState.bricks.forEach((brick) => {
      if (!brick.alive) return;
      if (ball.x > brick.x && ball.x < brick.x + brick.width && ball.y - ball.radius < brick.y + brick.height && ball.y + ball.radius > brick.y) {
        brick.alive = false;
        ball.vy *= -1;
        gameState.score += 15;
      }
    });

    if (ball.y > gameCanvas.height + 20) {
      endGame('Ball dropped!');
    }
    if (gameState.bricks.every((brick) => !brick.alive)) {
      endGame('Level complete!');
    }
  }

  if (currentGame.id !== 'clicker') {
    gameState.timer -= delta / 1000;
    if (gameState.timer <= 0) {
      gameState.timer = 0;
      endGame('Time is up!');
    }
  }
}

function renderGame() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  const backgroundGradient = ctx.createRadialGradient(
    gameCanvas.width * 0.3,
    gameCanvas.height * 0.2,
    20,
    gameCanvas.width * 0.5,
    gameCanvas.height * 0.6,
    gameCanvas.width * 0.9,
  );
  backgroundGradient.addColorStop(0, '#091624');
  backgroundGradient.addColorStop(0.4, '#04101f');
  backgroundGradient.addColorStop(1, '#02060d');
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

  if (gameState?.particles) {
    ctx.save();
    gameState.particles.forEach((particle) => {
      ctx.fillStyle = `rgba(37, 163, 255, ${particle.alpha})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(30, 150, 255, 0.16)';
  ctx.lineWidth = 1;
  for (let x = 0; x < gameCanvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gameCanvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < gameCanvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(gameCanvas.width, y);
    ctx.stroke();
  }

  if (!currentGame) return;

  if (currentGame.id === 'paperio') {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#16c7ff';
    ctx.lineWidth = 12;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    gameState.trail.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();

    const player = gameState.player;
    ctx.save();
    ctx.shadowColor = 'rgba(50, 220, 255, 0.7)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size + 8, 0, Math.PI * 2);
    ctx.stroke();

    gameStats.textContent = `Trail length: ${gameState.score} | Time: ${Math.ceil(gameState.timer)}`;
  }

  if (currentGame.id === 'dodge') {
    ctx.fillStyle = '#08baff';
    ctx.fillRect(gameState.player.x, gameCanvas.height - 40, 30, 20);
    ctx.fillStyle = '#ff4f6d';
    gameState.obstacles.forEach((o) => {
      ctx.fillRect(o.x, o.y, o.size, o.size);
    });
    gameStats.textContent = `Score: ${Math.floor(gameState.score)} | Time: ${Math.ceil(gameState.timer)}`;
  }

  if (currentGame.id === 'clicker') {
    ctx.fillStyle = '#0df3ff';
    ctx.beginPath();
    ctx.arc(gameState.target.x, gameState.target.y, gameState.target.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#60f0ff';
    ctx.lineWidth = 5;
    ctx.stroke();
    gameStats.textContent = `Clicks: ${gameState.score} | Time: ${Math.ceil(gameState.timer)}`;
  }

  if (currentGame.id === 'space') {
    ctx.fillStyle = '#08cbff';
    ctx.fillRect(80, gameState.player.y, 20, 20);
    gameState.obstacles.forEach((o) => {
      ctx.fillStyle = '#ff5a9d';
      ctx.fillRect(o.x, o.y, o.width, o.height);
    });
    gameStats.textContent = `Distance: ${Math.floor(gameState.score)} | Time: ${Math.ceil(gameState.timer)}`;
  }

  if (currentGame.id === 'breaker') {
    ctx.fillStyle = '#00e6ff';
    gameState.bricks.forEach((brick) => {
      if (!brick.alive) return;
      ctx.fillStyle = '#0ea8ff';
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.strokeStyle = '#8ef1ff';
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    });
    ctx.fillStyle = '#02c7ff';
    ctx.fillRect(gameState.paddle.x, gameCanvas.height - 30, gameState.paddle.width, 10);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    gameStats.textContent = `Bricks: ${gameState.bricks.filter((b) => b.alive).length} left | Time: ${Math.ceil(gameState.timer)}`;
  }

  if (gameState.lost) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  }
}

function gameLoop(timestamp) {
  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  updateGame(delta);
  renderGame();

  if (gameState.running) {
    animationFrame = requestAnimationFrame(gameLoop);
  } else {
    animationFrame = null;
  }
}

function handleSelectGame(event) {
  const gameId = event.target.dataset.game;
  if (!gameId) return;
  setupGame(gameId);
  showScreen(gameScreen);
}

function handleCanvasClick(event) {
  if (currentGame?.id !== 'clicker' || !gameState.running) return;
  const rect = gameCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const target = gameState.target;
  const distance = Math.hypot(x - target.x, y - target.y);
  if (distance <= target.radius) {
    gameState.score += 1;
    target.x = getRandom(50, gameCanvas.width - 50);
    target.y = getRandom(50, gameCanvas.height - 50);
  }
}

function handleKeys(event) {
  keys[event.code] = event.type === 'keydown';
}

function init() {
  showScreen(introScreen);
  playBtn.addEventListener('click', () => showScreen(gameMenu));
  menuBackBtn.addEventListener('click', () => showScreen(introScreen));
  backBtn.addEventListener('click', () => showScreen(gameMenu));
  startGameBtn.addEventListener('click', startGame);
  resetGameBtn.addEventListener('click', resetGame);
  document.querySelectorAll('.game-select').forEach((button) => {
    button.addEventListener('click', handleSelectGame);
  });
  window.addEventListener('keydown', handleKeys);
  window.addEventListener('keyup', handleKeys);
  gameCanvas.addEventListener('click', handleCanvasClick);
  setupGame('paperio');
}

init();

