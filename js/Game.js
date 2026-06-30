class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Managers
    this.storageManager = StorageManager;
    this.soundManager = new SoundManager();
    this.particleSystem = new ParticleSystem();
    this.inputManager = new InputManager();
    this.backgroundManager = new BackgroundManager(this.canvas);
    this.uiManager = new UIManager(this);

    // Game Core State
    this.isPlaying = false;
    this.isPaused = false;
    this.isEnding = false; // true during the brief cry animation before game-over modal
    this.isMuted = false;
    this.lastTime = 0;
    this.gameTime = 0; // seconds elapsed in this run

    // Physics / Scrolling
    this.baseSpeed = 5.0; // Starting scroll speed
    this.speed = 5.0;
    this.maxSpeed = 16.0;
    this.scrollOffset = 0;
    
    // Virtual Dimensions for High DPI scaling
    this.width = 900;
    this.height = 450;
    
    // Gameplay Metrics
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.lives = 3;
    this.comboMultiplier = 1.0;
    this.difficulty = 'normal'; // easy, normal, hard

    // Game Entities Pools
    this.obstacles = [];
    this.collectibles = [];
    this.powerups = [];

    // Spawning Timers
    this.obstacleSpawnTimer = 0;
    this.collectibleSpawnTimer = 0;
    this.powerupSpawnTimer = 0;

    // Active powerup state trackers
    this.activePowerUp = null; // 'shield', 'double_jump', 'wings', 'slow_mo', 'magnet', 'speed_boost'
    this.powerUpTimeRemaining = 0;
    this.powerUpDuration = 6.0; // 6 seconds base

    // Permanent & Session stats counters (for life of this run)
    this.sessionStats = {
      heartsLost: 0,
      poopsSteppedOn: 0,
      powerupsCollected: 0,
      crownsCollected: 0,
      gemsCollected: 0
    };

    // Preload & Init
    this.init();
  }

  init() {
    // Initialize Settings
    SettingsManager.initialize();
    const settings = SettingsManager.getSettings();
    this.difficulty = settings.difficulty;
    this.soundManager.updateSettings(settings.musicVolume, settings.sfxVolume, this.isMuted);

    // Setup input commands
    this.inputManager.onJump = () => {
      if (this.isPlaying && !this.isPaused) {
        if (this.player.jump()) {
          this.soundManager.playSFX('jump');
          this.particleSystem.spawnDust(this.player.x + 15, this.player.y + this.player.height);
        }
      }
    };

    this.inputManager.onDuck = () => {
      if (this.isPlaying && !this.isPaused) {
        this.player.duck();
      }
    };

    this.inputManager.onUnduck = () => {
      if (this.isPlaying && !this.isPaused) {
        this.player.unduck();
      }
    };

    this.inputManager.onPause = () => {
      this.togglePause();
    };

    this.inputManager.onRestart = () => {
      if (this.isPlaying) {
        this.startNewGame();
      }
    };

    // Setup Window Resize
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();

    // Player needs logical groundY — created after handleResize sets this.height
    this.player = new Player(this.canvas, this.height - 60);
    this.setupStartScreenAnimations();
    
    // Transition loading screen out
    setTimeout(() => {
      this.uiManager.showScreen('start');
      this.soundManager.startMusic();
    }, 1500);

    // Kick off RequestAnimationFrame Game loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  handleResize() {
    const dpr = window.devicePixelRatio || 1;

    // Fill the entire window — canvas CSS is already position:absolute inset:0
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    // Set the backing buffer to physical pixels for sharpness
    this.canvas.width = cssW * dpr;
    this.canvas.height = cssH * dpr;

    // Remove any inline style overrides so CSS layout stays in control
    this.canvas.style.width = '';
    this.canvas.style.height = '';

    // Scale context so all drawing uses logical (CSS) pixels as coordinates
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    // Store logical dimensions for game-object positioning
    this.width = cssW;
    this.height = cssH;

    // Ground sits 60px above bottom of window
    if (this.player) {
      this.player.groundY = cssH - 60;
    }
    if (this.backgroundManager) {
      this.backgroundManager.resize(cssW, cssH);
    }
  }

  updateSettings(settings) {
    this.difficulty = settings.difficulty;
    this.backgroundManager.setTheme(settings.theme);
    this.soundManager.updateSettings(settings.musicVolume, settings.sfxVolume, this.isMuted);
  }

  togglePause() {
    if (!this.isPlaying) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.uiManager.showScreen('pause');
      document.getElementById('pause-score').innerText = Math.floor(this.score);
    } else {
      this.uiManager.showScreen('game');
      this.lastTime = performance.now();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const settings = SettingsManager.getSettings();
    this.soundManager.updateSettings(settings.musicVolume, settings.sfxVolume, this.isMuted);
  }

  startNewGame() {
    this.isPlaying = true;
    this.isPaused = false;
    
    // Reset stats
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.lives = 3;
    this.comboMultiplier = 1.0;
    this.gameTime = 0;
    
    // Set dynamic base speed based on difficulty choice
    if (this.difficulty === 'easy') {
      this.baseSpeed = 4.2;
    } else if (this.difficulty === 'hard') {
      this.baseSpeed = 6.2;
    } else {
      this.baseSpeed = 5.0; // Normal
    }
    this.speed = this.baseSpeed;

    this.sessionStats = {
      heartsLost: 0,
      poopsSteppedOn: 0,
      powerupsCollected: 0,
      crownsCollected: 0,
      gemsCollected: 0
    };

    // Reset components — pass logical window height (not DPR-scaled canvas.height)
    this.player.reset(this.height);
    this.obstacles = [];
    this.collectibles = [];
    this.powerups = [];
    this.activePowerUp = null;
    this.powerUpTimeRemaining = 0;

    // Reset spawn intervals
    this.obstacleSpawnTimer = 1.0; // Wait 1 sec before first spawn
    this.collectibleSpawnTimer = 2.0;
    this.powerupSpawnTimer = 8.0; // Powerup every 8s average

    this.uiManager.showScreen('game');
    this.uiManager.updateHUD(this.score, this.lives, this.coins, this.comboMultiplier);
    this.uiManager.hidePowerUpBar();

    // Start background music loop
    this.soundManager.startMusic();
    this.lastTime = performance.now();
  }

  exitToMenu() {
    this.isPlaying = false;
    this.isPaused = false;
    this.uiManager.showScreen('start');
  }

  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Clamp dt to avoid massive frame leaps if user tab-switches
    if (dt > 0.1) dt = 0.1;

    if (this.isPlaying && !this.isPaused) {
      this.update(dt);
      this.draw();
    } else if (this.isEnding) {
      // Brief "ending" phase: princess cries on-screen before modal appears
      // Update player animation (so cry state + speech bubble animate) but nothing else
      this.player.update(dt, 0, this.particleSystem);
      this.particleSystem.update(dt);
      this.draw();
    } else if (!this.isPlaying) {
      // Just render menu/idle backgrounds
      this.updateMenuAnimations(dt);
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    this.gameTime += dt;
    
    // 1. Difficulty Scaling Over Time (Continuous increase)
    // Speed increases slowly but continuously
    const difficultyScalingFactor = this.difficulty === 'hard' ? 0.08 : (this.difficulty === 'easy' ? 0.03 : 0.05);
    this.speed = Math.min(this.maxSpeed, this.baseSpeed + this.gameTime * difficultyScalingFactor);

    // 2. Parallax scroll calculation
    const currentFrameSpeed = this.speed;
    const reducedMotion = SettingsManager.getSettings().reducedMotion;
    this.scrollOffset += currentFrameSpeed * dt * 60;

    // 3. Update Managers
    this.backgroundManager.update(dt, currentFrameSpeed, reducedMotion);
    this.player.update(dt, currentFrameSpeed, this.particleSystem);
    this.particleSystem.update(dt);

    // 4. Powerup Timer count downs
    if (this.activePowerUp) {
      this.powerUpTimeRemaining -= dt;
      if (this.powerUpTimeRemaining <= 0) {
        this.deactivatePowerUp();
      } else {
        this.uiManager.showPowerUpBar(this.activePowerUp, this.powerUpTimeRemaining / this.powerUpDuration);
      }
    }

    // 5. Spawning Obstacles / Collectibles / PowerUps
    this.handleSpawning(dt);

    // 6. Update Entities
    this.obstacles.forEach(obs => obs.update(dt, currentFrameSpeed));
    this.collectibles.forEach(col => col.update(dt, currentFrameSpeed, this.player));
    this.powerups.forEach(pw => pw.update(dt, currentFrameSpeed, this.player));

    // Clear inactive off-screen elements
    this.obstacles = this.obstacles.filter(obs => obs.active);
    this.collectibles = this.collectibles.filter(col => col.active);
    this.powerups = this.powerups.filter(pw => pw.active);

    // 7. Collision Detection & Response
    this.handleCollisions();

    // 8. Distance & Score ticks
    this.distance += (currentFrameSpeed * dt * 3.5); // Meters simulation
    
    // Base score matches running distance
    let scoreMultiplier = 1;
    if (this.activePowerUp === 'speed_boost') scoreMultiplier = 3; // Boost scores faster
    
    this.score += (currentFrameSpeed * dt * 2) * scoreMultiplier * this.comboMultiplier;

    this.uiManager.updateHUD(this.score, this.lives, this.coins, this.comboMultiplier);
  }

  handleSpawning(dt) {
    // Dynamic thresholds based on difficulty choice
    let spawnRateMod = 1.0;
    if (this.difficulty === 'easy') spawnRateMod = 1.3;
    if (this.difficulty === 'hard') spawnRateMod = 0.75;

    // Obstacle spawn frequency scales (getting faster as time/speed rises)
    this.obstacleSpawnTimer -= dt;
    if (this.obstacleSpawnTimer <= 0) {
      const types = ['poop_small', 'poop_large', 'poop_triple', 'cactus', 'bird', 'mud', 'barrel'];
      const weight = Math.random();
      
      let selectedType = 'poop_small';
      if (weight < 0.2) selectedType = 'poop_small';
      else if (weight < 0.35) selectedType = 'poop_large';
      else if (weight < 0.45) selectedType = 'poop_triple';
      else if (weight < 0.65) selectedType = 'cactus';
      else if (weight < 0.8) selectedType = 'bird';
      else if (weight < 0.9) selectedType = 'mud';
      else selectedType = 'barrel';

      this.obstacles.push(new Obstacle(selectedType, this.width, this.player.groundY, this.difficulty));
      
      // Calculate random spawn interval that decreases as speed rises
      const baseSpawnInterval = 1.6 + Math.random() * 2.0;
      this.obstacleSpawnTimer = (baseSpawnInterval * (5 / this.speed)) * spawnRateMod;
    }

    // Collectible Spawning
    this.collectibleSpawnTimer -= dt;
    if (this.collectibleSpawnTimer <= 0) {
      const types = ['gem', 'gem', 'gem', 'crown', 'crown', 'star', 'heart'];
      const weight = Math.random();
      
      let type = 'gem';
      if (weight < 0.5) type = 'gem';
      else if (weight < 0.75) type = 'crown';
      else if (weight < 0.9) type = 'star';
      else type = 'heart'; // Restores heart, spawn is rarer

      this.collectibles.push(new Collectible(type, this.width, this.player.groundY));
      this.collectibleSpawnTimer = 1.8 + Math.random() * 3.0;
    }

    // PowerUp Spawning (6s to 12s interval)
    this.powerupSpawnTimer -= dt;
    if (this.powerupSpawnTimer <= 0) {
      const powerupTypes = ['shield', 'double_jump', 'wings', 'slow_mo', 'magnet', 'speed_boost'];
      const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
      
      this.powerups.push(new PowerUp(type, this.width, this.player.groundY));
      this.powerupSpawnTimer = 8.0 + Math.random() * 10.0;
    }
  }

  handleCollisions() {
    // 1. Obstacles Collision
    this.obstacles.forEach(obs => {
      if (obs.active && CollisionManager.checkPlayerCollision(this.player, obs)) {
        obs.active = false;
        this.triggerObstacleHit(obs);
      }
    });

    // 2. Collectibles Collision
    this.collectibles.forEach(col => {
      if (col.active && CollisionManager.checkPlayerCollision(this.player, col)) {
        col.active = false;
        this.triggerCollectiblePickup(col);
      }
    });

    // 3. Powerups Collision
    this.powerups.forEach(pw => {
      if (pw.active && CollisionManager.checkPlayerCollision(this.player, pw)) {
        pw.active = false;
        this.triggerPowerupPickup(pw);
      }
    });
  }

  triggerObstacleHit(obs) {
    // If Speed Boost or Rainbow Shield is active, player crushes the obstacle without taking damage!
    if (this.activePowerUp === 'speed_boost') {
      this.soundManager.playSFX('gem');
      this.particleSystem.spawnSparkles(obs.x, obs.y, '#ffd700', 8);
      this.score += 150; // extra crush score
      return;
    }

    if (this.player.hasShield) {
      this.deactivatePowerUp(); // lose shield
      this.soundManager.playSFX('gem');
      this.particleSystem.spawnSparkles(obs.x, obs.y, '#ffd700', 10);
      this.player.setInvincible(1.0); // 1s brief invincibility buffer
      return;
    }

    if (this.player.isInvincible) return; // ignore hit

    // Damage shake
    this.triggerScreenShake();

    // Specific Obstacle behaviors
    if (obs.type.startsWith('poop')) {
      this.soundManager.playSFX('poop_squish');
      this.soundManager.playSFX('princess_cry');
      this.particleSystem.spawnPoopSplash(obs.x + obs.width/2, obs.y + obs.height/2);

      // Princess says "Oops!"
      this.player.say('Oops! 💩', '#8B4513', 2.2);

      // Cry state slows down speed for 3 seconds
      this.player.triggerPoopStep();
      this.speed = Math.max(2.0, this.speed - 3.5); // Slower runner
      this.sessionStats.poopsSteppedOn++;
      this.comboMultiplier = 1.0; // Combo resets!

      // Trigger royal funny messages
      const messages = [
        "EWWWW!! 💩",
        "Princess stepped in poop!",
        "Royal Disaster!",
        "Someone call the castle maid!",
        "Bath time! 🛁",
        "Gross!!"
      ];
      const randMsg = messages[Math.floor(Math.random() * messages.length)];
      this.uiManager.showFunnyMessage(randMsg);

      // Step on poop costs 1 heart
      this.loseHeart();

    } else {
      // Cactus, Bird, Barrels
      this.soundManager.playSFX('princess_cry');
      this.particleSystem.spawnPoopSplash(this.player.x + 20, this.player.y + 40); // reuse splash
      this.player.say('Ouch! 💥', '#e74c3c', 1.8);
      this.loseHeart();
      this.player.setInvincible(1.8); // 1.8 seconds invincibility flicker
    }
  }

  loseHeart() {
    this.lives--;
    this.sessionStats.heartsLost++;
    
    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  triggerScreenShake() {
    const el = document.getElementById('game-screen');
    el.classList.add('screen-shake');
    setTimeout(() => el.classList.remove('screen-shake'), 400);
  }

  triggerCollectiblePickup(col) {
    this.particleSystem.spawnCoinBurst(col.x + col.width/2, col.y + col.height/2);

    switch (col.type) {
      case 'heart':
        this.soundManager.playSFX('coin');
        if (this.lives < 3) {
          this.lives++;
          this.player.say('Yay! ♥️', '#ff69b4', 1.8);
        } else {
          this.player.say('Full HP! 💖', '#ff69b4', 1.5);
        }
        break;
      case 'crown':
        this.soundManager.playSFX('gem');
        this.score += 500 * this.comboMultiplier; // Scale bonus by combo!
        this.comboMultiplier += 0.5; // Crown adds heavy combo
        this.sessionStats.crownsCollected++;
        this.player.say('Yes! 👑✨', '#ffd700', 2.0);
        break;
      case 'star':
        this.soundManager.playSFX('powerup');
        this.player.setInvincible(4.0); // 4s invincibility
        this.comboMultiplier += 0.3;
        this.player.say('Woohoo! ⭐', '#f1c40f', 1.8);
        break;
      case 'gem':
        this.soundManager.playSFX('coin');
        this.coins++;
        this.score += 100 * this.comboMultiplier;
        this.comboMultiplier += 0.1; // Gem adds small combo
        this.sessionStats.gemsCollected++;
        this.player.say('Yes! ✨', '#00d4ff', 1.5);
        break;
    }
  }

  triggerPowerupPickup(pw) {
    this.soundManager.playSFX('powerup');
    this.particleSystem.spawnSparkles(pw.x + pw.width/2, pw.y + pw.height/2, '#87ceeb', 12);
    
    // Set active
    this.activePowerUp = pw.type;
    this.powerUpTimeRemaining = this.powerUpDuration;
    this.sessionStats.powerupsCollected++;
    this.comboMultiplier += 0.2; // PowerUp adds combo

    // Apply special configurations on Player
    this.player.hasDoubleJumpPowerup = (pw.type === 'double_jump');
    this.player.hasWings = (pw.type === 'wings');
    this.player.hasMagnet = (pw.type === 'magnet');
    this.player.hasShield = (pw.type === 'shield');

    if (pw.type === 'speed_boost') {
      this.speed = Math.min(this.maxSpeed, this.speed + 4.5);
      this.player.setInvincible(this.powerUpDuration);
    }

    if (pw.type === 'slow_mo') {
      this.speed = Math.max(3.0, this.speed * 0.55); // Slow down the pace
    }

    // UIManager notification
    const nameMap = {
      shield: 'Rainbow Shield! 🛡️',
      double_jump: 'Double Jump! 👟',
      wings: 'Royal Wings! 🪶',
      slow_mo: 'Slow Motion! ⏳',
      magnet: 'Coin Magnet! 🧲',
      speed_boost: 'Speed Boost! ⚡'
    };
    this.uiManager.showPowerupNotification(nameMap[pw.type] || 'Powerup!');
  }

  deactivatePowerUp() {
    this.activePowerUp = null;
    this.uiManager.hidePowerUpBar();

    // Reset player config
    this.player.hasDoubleJumpPowerup = false;
    this.player.hasWings = false;
    this.player.hasMagnet = false;
    this.player.hasShield = false;

    // Reset speed normalizations if speed_boost/slow_mo finished
    if (this.difficulty === 'hard') {
      this.baseSpeed = 6.2;
    } else if (this.difficulty === 'easy') {
      this.baseSpeed = 4.2;
    } else {
      this.baseSpeed = 5.0;
    }
  }

  triggerGameOver() {
    this.isPlaying = false;
    this.isEnding = true;   // keep canvas rendering for brief cry moment
    this.soundManager.stopMusic();
    this.soundManager.playSFX('gameover');

    // Princess cries out before game over screen appears
    this.player.say('😭 Noooo!', '#e74c3c', 2.5);
    this.player.state = 'CRYING';

    // 1. Submit Leaderboard Score
    const result = LeaderboardManager.submitScore(this.score, this.distance, this.coins, this.gameTime);

    // 2. Record Lifelong Statistics
    StatisticsManager.recordGame(this.score, this.distance, this.coins, this.gameTime, this.sessionStats);

    // 3. Show GameOver after brief crying delay so the bubble is visible
    setTimeout(() => {
      this.isEnding = false;
      this.uiManager.showGameOver(this.score, this.distance, this.coins, result);
      this.drawGameOverPrincess();
    }, 800);
  }

  drawGameOverPrincess() {
    const c = document.getElementById('gameover-princess-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Scale canvas for sharp rendering
    c.width = 100 * dpr;
    c.height = 120 * dpr;
    
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    
    ctx.clearRect(0, 0, 100, 120);

    ctx.save();
    
    // Position offset
    const px = 20;
    const py = 15;
    const pw = 60;
    const ph = 90;

    // Hair behind
    ctx.fillStyle = '#5c4033';
    ctx.beginPath();
    ctx.arc(px + pw/2, py + ph * 0.28, 18, 0, Math.PI * 2);
    ctx.fill();

    // Dress base
    ctx.fillStyle = '#ff69b4';
    const skirtY = py + 44;
    const skirtH = 44;
    ctx.beginPath();
    ctx.moveTo(px + 14, skirtY);
    ctx.quadraticCurveTo(px + 2, skirtY + skirtH * 0.4, px + 2, skirtY + skirtH);
    ctx.lineTo(px + pw - 2, skirtY + skirtH);
    ctx.quadraticCurveTo(px + pw - 2, skirtY + skirtH * 0.4, px + pw - 14, skirtY);
    ctx.closePath();
    ctx.fill();

    // Puff sleeves
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px + 12, py + 36, 8, 0, Math.PI * 2);
    ctx.arc(px + pw - 12, py + 36, 8, 0, Math.PI * 2);
    ctx.fill();

    // Face skin
    ctx.fillStyle = '#ffdbac';
    const headX = px + pw/2;
    const headY = py + 24;
    const headRadius = 14;
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillRect(headX - 4, headY + 9, 8, 8);

    // Hair front
    ctx.fillStyle = '#5c4033';
    ctx.beginPath();
    ctx.arc(headX - 8, headY - 8, 8, 0, Math.PI * 2);
    ctx.arc(headX + 8, headY - 8, 8, 0, Math.PI * 2);
    ctx.arc(headX, headY - 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(headX - 16, headY - 3, 5, 18);
    ctx.fillRect(headX + 11, headY - 3, 5, 18);

    // Golden Crown
    ctx.fillStyle = '#ffd700';
    const crownCenterY = headY - 14;
    ctx.beginPath();
    ctx.moveTo(headX - 11, crownCenterY);
    ctx.lineTo(headX - 9, crownCenterY - 9);
    ctx.lineTo(headX - 4, crownCenterY - 4);
    ctx.lineTo(headX, crownCenterY - 11);
    ctx.lineTo(headX + 4, crownCenterY - 4);
    ctx.lineTo(headX + 9, crownCenterY - 9);
    ctx.lineTo(headX + 11, crownCenterY);
    ctx.closePath();
    ctx.fill();

    // Rubies
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(headX - 9, crownCenterY - 9, 2, 0, Math.PI * 2);
    ctx.arc(headX, crownCenterY - 11, 2, 0, Math.PI * 2);
    ctx.arc(headX + 9, crownCenterY - 9, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sobbing Closed Eyes ( > < )
    const eyeCenterY = headY - 1;
    const eyeLX = headX - 6;
    const eyeRX = headX + 6;
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(eyeLX - 4, eyeCenterY - 3);
    ctx.lineTo(eyeLX + 1, eyeCenterY);
    ctx.lineTo(eyeLX - 4, eyeCenterY + 3);
    ctx.moveTo(eyeRX + 4, eyeCenterY - 3);
    ctx.lineTo(eyeRX - 1, eyeCenterY);
    ctx.lineTo(eyeRX + 4, eyeCenterY + 3);
    ctx.stroke();

    // Large weeping tear pools
    ctx.fillStyle = '#00bfff';
    ctx.beginPath();
    ctx.arc(eyeLX, eyeCenterY + 8, 4, 0, Math.PI * 2);
    ctx.arc(eyeRX, eyeCenterY + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Crying mouth
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(headX, headY + 6, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Rubbing hands
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(headX - 11, headY + 3, 6, 6);
    ctx.fillRect(headX + 5, headY + 3, 6, 6);

    ctx.restore();
  }

  setupStartScreenAnimations() {
    // Draw animated idle princess in start screen container
    const tick = () => {
      if (this.isPlaying) return;
      const c = document.getElementById('start-princess-canvas');
      if (c) {
        const ctx = c.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        c.width = 120 * dpr;
        c.height = 140 * dpr;
        
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
        
        ctx.clearRect(0, 0, 120, 140);
        
        ctx.save();
        const time = Date.now() * 0.003;
        const bob = Math.sin(time * 2) * 4;

        const px = 30;
        const py = 25 + bob;
        const pw = 60;
        const ph = 90;

        // Hair behind
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.arc(px + pw/2, py + ph * 0.28, 18, 0, Math.PI * 2);
        ctx.fill();

        // Dress base
        ctx.fillStyle = '#ff69b4';
        const skirtY = py + 44;
        const skirtH = 44;
        ctx.beginPath();
        ctx.moveTo(px + 14, skirtY);
        ctx.quadraticCurveTo(px + 2, skirtY + skirtH * 0.4, px + 2, skirtY + skirtH);
        ctx.lineTo(px + pw - 2, skirtY + skirtH);
        ctx.quadraticCurveTo(px + pw - 2, skirtY + skirtH * 0.4, px + pw - 14, skirtY);
        ctx.closePath();
        ctx.fill();

        // Puff sleeves
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px + 12, py + 36, 8, 0, Math.PI * 2);
        ctx.arc(px + pw - 12, py + 36, 8, 0, Math.PI * 2);
        ctx.fill();

        // Face skin
        ctx.fillStyle = '#ffdbac';
        const headX = px + pw/2;
        const headY = py + 24;
        const headRadius = 14;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Neck
        ctx.fillRect(headX - 4, headY + 9, 8, 8);

        // Hair front
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.arc(headX - 8, headY - 8, 8, 0, Math.PI * 2);
        ctx.arc(headX + 8, headY - 8, 8, 0, Math.PI * 2);
        ctx.arc(headX, headY - 10, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(headX - 16, headY - 3, 5, 18);
        ctx.fillRect(headX + 11, headY - 3, 5, 18);

        // Golden Crown
        ctx.fillStyle = '#ffd700';
        const crownCenterY = headY - 14;
        ctx.beginPath();
        ctx.moveTo(headX - 11, crownCenterY);
        ctx.lineTo(headX - 9, crownCenterY - 9);
        ctx.lineTo(headX - 4, crownCenterY - 4);
        ctx.lineTo(headX, crownCenterY - 11);
        ctx.lineTo(headX + 4, crownCenterY - 4);
        ctx.lineTo(headX + 9, crownCenterY - 9);
        ctx.lineTo(headX + 11, crownCenterY);
        ctx.closePath();
        ctx.fill();

        // Rubies
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(headX - 9, crownCenterY - 9, 2, 0, Math.PI * 2);
        ctx.arc(headX, crownCenterY - 11, 2, 0, Math.PI * 2);
        ctx.arc(headX + 9, crownCenterY - 9, 2, 0, Math.PI * 2);
        ctx.fill();

        // Sparkling Winking Eyes
        const eyeCenterY = headY - 1;
        const eyeLX = headX - 6;
        const eyeRX = headX + 6;
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(eyeLX, eyeCenterY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(eyeLX - 1, eyeCenterY - 2.5, 2, 2);

        if (Math.sin(time) > 0) {
          ctx.fillStyle = '#222222';
          ctx.beginPath();
          ctx.arc(eyeRX, eyeCenterY, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(eyeRX - 1, eyeCenterY - 2.5, 2, 2);
        } else {
          // Wink
          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(eyeRX, eyeCenterY, 4, 0, Math.PI, false);
          ctx.stroke();
        }

        // Cheeks
        ctx.fillStyle = 'rgba(255, 182, 193, 0.75)';
        ctx.beginPath();
        ctx.arc(eyeLX - 5, eyeCenterY + 5, 3, 0, Math.PI * 2);
        ctx.arc(eyeRX + 5, eyeCenterY + 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#ff4b8c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(headX, headY + 4, 4, 0, Math.PI, false);
        ctx.stroke();

        // Arms down
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(px + 8, py + 44, 5, 15);
        ctx.fillRect(px + pw - 13, py + 44, 5, 15);

        ctx.restore();
      }
      setTimeout(tick, 60);
    };
    tick();
  }

  updateMenuAnimations(dt) {
    // Gentle sky scroll — much slower on the start screen
    this.scrollOffset += 0.25 * dt * 60;
    this.backgroundManager.update(dt, 0.25, false);
    
    // Draw background onto the start-screen background canvas
    const startBgCanvas = document.getElementById('start-bg-canvas');
    if (startBgCanvas && this.uiManager.activeScreen === 'start') {
      const containerW = window.innerWidth;
      const containerH = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      // Only resize the buffer when dimensions actually change (avoids re-randomising clouds every frame)
      const needsResize =
        startBgCanvas.width !== Math.round(containerW * dpr) ||
        startBgCanvas.height !== Math.round(containerH * dpr);

      if (needsResize) {
        startBgCanvas.width = Math.round(containerW * dpr);
        startBgCanvas.height = Math.round(containerH * dpr);
        this.backgroundManager.resize(containerW, containerH);
      }

      const menuCtx = startBgCanvas.getContext('2d');
      menuCtx.resetTransform();
      menuCtx.scale(dpr, dpr);

      this.backgroundManager.canvas = startBgCanvas;
      this.backgroundManager.ctx = menuCtx;
      this.backgroundManager.draw(this.scrollOffset);
    }
  }

  draw() {
    // Normal Gameplay active rendering
    // Restore default game canvas binding in case menu overrode it
    this.backgroundManager.canvas = this.canvas;
    this.backgroundManager.ctx = this.ctx;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Parallax Background
    this.backgroundManager.draw(this.scrollOffset);

    // 2. Draw Entities
    this.obstacles.forEach(obs => obs.draw(this.ctx));
    this.collectibles.forEach(col => col.draw(this.ctx));
    this.powerups.forEach(pw => pw.draw(this.ctx));

    // 3. Draw Player
    this.player.draw(this.ctx);

    // 4. Draw Particles
    this.particleSystem.draw(this.ctx);
  }
}

// Start Game system on window load
window.addEventListener('load', () => {
  window.GameInstance = new Game();
});
