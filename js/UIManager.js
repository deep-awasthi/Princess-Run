class UIManager {
  constructor(game) {
    this.game = game;
    this.activeScreen = 'loading-screen';
    
    // Screens
    this.screens = {
      loading: document.getElementById('loading-screen'),
      start: document.getElementById('start-screen'),
      game: document.getElementById('game-screen'),
      pause: document.getElementById('pause-screen'),
      gameover: document.getElementById('gameover-screen'),
      leaderboard: document.getElementById('leaderboard-screen'),
      stats: document.getElementById('stats-screen'),
      settings: document.getElementById('settings-screen'),
      confirm: document.getElementById('confirm-dialog')
    };

    // HUD Elements
    this.hud = {
      score: document.getElementById('score-value'),
      combo: document.getElementById('combo-value'),
      best: document.getElementById('best-value'),
      coins: document.getElementById('coin-count'),
      powerupBar: document.getElementById('powerup-bar'),
      powerupDisplay: document.getElementById('powerup-display'),
      powerupIcon: document.getElementById('powerup-icon'),
      lives: [
        document.getElementById('life1'),
        document.getElementById('life2'),
        document.getElementById('life3')
      ]
    };

    // Dialog handlers
    this.confirmCallback = null;

    this.bindEvents();
    this.initializeUI();
  }

  showScreen(screenKey) {
    const isOverlay = screenKey === 'pause' || screenKey === 'gameover';

    // Remove hidden + active from every screen
    Object.values(this.screens).forEach(screen => {
      if (!screen) return;
      screen.classList.add('hidden');
      screen.classList.remove('active');
    });

    if (screenKey === 'game') {
      // Full game view
      this.screens.game.classList.remove('hidden');
      this.screens.game.classList.add('active');

    } else if (isOverlay) {
      // Overlay sits on top of the running game canvas
      // Keep the game screen visible as background
      this.screens.game.classList.remove('hidden');
      this.screens.game.classList.add('active');

      const overlay = this.screens[screenKey];
      overlay.classList.remove('hidden');
      overlay.classList.add('active');

    } else {
      // Full-page screens (start, leaderboard, stats, settings…)
      const target = this.screens[screenKey];
      if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
      }
    }

    this.activeScreen = screenKey;
  }

  initializeUI() {
    // Update settings form with local storage values
    const settings = SettingsManager.getSettings();
    
    document.getElementById('setting-music').value = settings.musicVolume;
    document.getElementById('music-val').innerText = settings.musicVolume;
    
    document.getElementById('setting-sfx').value = settings.sfxVolume;
    document.getElementById('sfx-val').innerText = settings.sfxVolume;
    
    document.getElementById('setting-theme').value = settings.theme || 'light';
    document.getElementById('setting-difficulty').value = settings.difficulty || 'normal';
    document.getElementById('setting-quality').value = settings.graphicsQuality || 'medium';
    
    document.getElementById('setting-reduced-motion').checked = !!settings.reducedMotion;
    document.getElementById('setting-high-contrast').checked = !!settings.highContrast;

    // Apply styles
    SettingsManager.applySettings(settings);

    // Initial best score in HUD
    const stats = StatisticsManager.getStats();
    this.hud.best.innerText = stats.highestScore || 0;
  }

  bindEvents() {
    // Play button
    document.getElementById('btn-play').addEventListener('click', () => {
      this.game.startNewGame();
    });

    // Start Screen navigation
    document.getElementById('btn-leaderboard').addEventListener('click', () => {
      this.renderLeaderboards();
      this.showScreen('leaderboard');
    });
    document.getElementById('btn-stats').addEventListener('click', () => {
      this.renderStats();
      this.showScreen('stats');
    });
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.showScreen('settings');
    });

    // Back buttons
    document.getElementById('btn-lb-back').addEventListener('click', () => this.showScreen('start'));
    document.getElementById('btn-stats-back').addEventListener('click', () => this.showScreen('start'));
    document.getElementById('btn-settings-back').addEventListener('click', () => this.showScreen('start'));

    // Pause HUD click
    document.getElementById('btn-pause').addEventListener('click', () => {
      this.game.togglePause();
    });

    // Mute HUD click
    const btnMute = document.getElementById('btn-mute');
    btnMute.addEventListener('click', () => {
      this.game.toggleMute();
      btnMute.innerText = this.game.isMuted ? '🔇' : '🔊';
    });

    // Pause Screen Buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.game.togglePause();
    });
    document.getElementById('btn-restart-pause').addEventListener('click', () => {
      this.showScreen('game');
      this.game.startNewGame();
    });
    document.getElementById('btn-menu-pause').addEventListener('click', () => {
      this.game.exitToMenu();
    });

    // GameOver Screen Buttons
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.showScreen('game');
      this.game.startNewGame();
    });
    document.getElementById('btn-gameover-leaderboard').addEventListener('click', () => {
      this.renderLeaderboards();
      this.showScreen('leaderboard');
    });
    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
      this.game.exitToMenu();
    });

    // Leaderboard Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const tabName = e.target.getAttribute('data-tab');
        document.getElementById('tab-top5').classList.remove('active');
        document.getElementById('tab-last5').classList.remove('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
      });
    });

    // Reset Buttons
    document.getElementById('btn-reset-lb').addEventListener('click', () => {
      this.showConfirmDialog('Reset Leaderboard', 'Are you sure you want to clear all high scores?', () => {
        LeaderboardManager.reset();
        this.renderLeaderboards();
      });
    });

    document.getElementById('btn-reset-stats').addEventListener('click', () => {
      this.showConfirmDialog('Reset Statistics', 'Are you sure you want to delete all historical logs?', () => {
        StatisticsManager.reset();
        this.renderStats();
      });
    });

    // Settings Resets
    document.getElementById('btn-settings-reset-lb').addEventListener('click', () => {
      this.showConfirmDialog('Reset Leaderboard', 'Delete all high scores?', () => {
        LeaderboardManager.reset();
      });
    });
    document.getElementById('btn-settings-reset-stats').addEventListener('click', () => {
      this.showConfirmDialog('Reset Statistics', 'Delete all stats history?', () => {
        StatisticsManager.reset();
      });
    });

    // Confirm dialog controls
    document.getElementById('btn-confirm-yes').addEventListener('click', () => {
      if (this.confirmCallback) this.confirmCallback();
      this.screens.confirm.classList.add('hidden');
    });
    document.getElementById('btn-confirm-no').addEventListener('click', () => {
      this.screens.confirm.classList.add('hidden');
    });

    // Volume input events
    const musicSlider = document.getElementById('setting-music');
    musicSlider.addEventListener('input', (e) => {
      document.getElementById('music-val').innerText = e.target.value;
      this.saveSettingsFromUI();
    });

    const sfxSlider = document.getElementById('setting-sfx');
    sfxSlider.addEventListener('input', (e) => {
      document.getElementById('sfx-val').innerText = e.target.value;
      this.saveSettingsFromUI();
      // Play a small beep indicator
      this.game.soundManager.playSFX('coin');
    });

    // Standard select settings change
    document.getElementById('setting-theme').addEventListener('change', () => this.saveSettingsFromUI());
    document.getElementById('setting-difficulty').addEventListener('change', () => this.saveSettingsFromUI());
    document.getElementById('setting-quality').addEventListener('change', () => this.saveSettingsFromUI());
    
    // Accessibility switches
    document.getElementById('setting-reduced-motion').addEventListener('change', () => this.saveSettingsFromUI());
    document.getElementById('setting-high-contrast').addEventListener('change', () => this.saveSettingsFromUI());

    // Fullscreen toggle
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      this.toggleFullscreen();
    });
  }

  showConfirmDialog(title, message, callback) {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    this.confirmCallback = callback;
    this.screens.confirm.classList.remove('hidden');
  }

  saveSettingsFromUI() {
    const theme = document.getElementById('setting-theme').value;
    const diff = document.getElementById('setting-difficulty').value;
    const quality = document.getElementById('setting-quality').value;
    
    const settings = {
      musicVolume: parseInt(document.getElementById('setting-music').value),
      sfxVolume: parseInt(document.getElementById('setting-sfx').value),
      theme: theme,
      difficulty: diff,
      graphicsQuality: quality,
      reducedMotion: document.getElementById('setting-reduced-motion').checked,
      highContrast: document.getElementById('setting-high-contrast').checked
    };

    SettingsManager.saveSettings(settings);
    this.game.updateSettings(settings);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  updateHUD(score, lives, coins, combo = 1.0) {
    this.hud.score.innerText = Math.floor(score);
    this.hud.coins.innerText = coins;
    if (this.hud.combo) {
      this.hud.combo.innerText = `${combo.toFixed(1)}x`;
      // Sparkle/glow combo text if high combo
      if (combo > 1.5) {
        this.hud.combo.style.color = 'var(--gold)';
        this.hud.combo.style.textShadow = '0 0 8px rgba(255,215,0,0.8)';
      } else {
        this.hud.combo.style.color = '#fff';
        this.hud.combo.style.textShadow = '1px 1px 0 rgba(0,0,0,0.8)';
      }
    }

    // Update hearts lost styling
    for (let i = 0; i < 3; i++) {
      if (i < lives) {
        this.hud.lives[i].classList.remove('lost');
        this.hud.lives[i].innerText = '❤️';
      } else {
        this.hud.lives[i].classList.add('lost');
      }
    }
  }

  showPowerUpBar(type, ratio) {
    this.hud.powerupDisplay.classList.remove('hidden');
    
    // Set matching emoji
    const icons = {
      shield: '🛡️',
      double_jump: '👟',
      wings: '🪶',
      slow_mo: '⏳',
      magnet: '🧲',
      speed_boost: '⚡'
    };
    this.hud.powerupIcon.innerText = icons[type] || '⚡';
    this.hud.powerupBar.style.width = `${ratio * 100}%`;
  }

  hidePowerUpBar() {
    this.hud.powerupDisplay.classList.add('hidden');
  }

  showFunnyMessage(text) {
    const el = document.getElementById('funny-message');
    el.innerText = text;
    el.classList.remove('hidden');
    el.classList.add('show');

    // Automatically hide after 2 seconds
    setTimeout(() => {
      el.classList.remove('show');
      el.classList.add('hidden');
    }, 1800);
  }

  showPowerupNotification(text) {
    const el = document.getElementById('powerup-notification');
    el.innerText = text;
    el.classList.remove('hidden');
    el.classList.add('show');

    setTimeout(() => {
      el.classList.remove('show');
      el.classList.add('hidden');
    }, 1500);
  }

  renderLeaderboards() {
    // Render Top 5 Table
    const top5 = LeaderboardManager.getTopFive();
    const topBody = document.getElementById('top5-body');
    topBody.innerHTML = '';

    if (top5.length === 0) {
      topBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No games recorded yet!</td></tr>`;
    } else {
      top5.forEach((r, idx) => {
        const row = document.createElement('tr');
        if (idx === 0) row.className = 'top-rank';
        row.innerHTML = `
          <td>${idx + 1}</td>
          <td>${r.score}</td>
          <td>${r.distance}m</td>
          <td>${r.coins}</td>
          <td>${r.date}</td>
        `;
        topBody.appendChild(row);
      });
    }

    // Render Last 5 Table
    const last5 = LeaderboardManager.getLastFive();
    const lastBody = document.getElementById('last5-body');
    lastBody.innerHTML = '';

    if (last5.length === 0) {
      lastBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No games recorded yet!</td></tr>`;
    } else {
      last5.forEach((r, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${idx + 1}</td>
          <td>${r.score}</td>
          <td>${r.distance}m</td>
          <td>${r.coins}</td>
          <td>${r.survivalTime}s</td>
          <td>${r.date}</td>
        `;
        lastBody.appendChild(row);
      });
    }
  }

  renderStats() {
    const stats = StatisticsManager.getStats();
    const container = document.getElementById('stats-grid');
    container.innerHTML = '';

    const cards = [
      { label: 'Games Played', val: stats.gamesPlayed || 0, icon: '🎮' },
      { label: 'Highest Score', val: stats.highestScore || 0, icon: '🏆' },
      { label: 'Average Score', val: stats.averageScore || 0, icon: '📈' },
      { label: 'Highest Distance', val: `${stats.highestDistance || 0}m`, icon: '🏃‍♀️' },
      { label: 'Longest Survival', val: `${stats.longestSurvival || 0}s`, icon: '⏱️' },
      { label: 'Total Distance', val: `${stats.totalDistance || 0}m`, icon: '🛣️' },
      { label: 'Total Coins', val: stats.totalCoins || 0, icon: '💎' },
      { label: 'Hearts Lost', val: stats.totalHeartsLost || 0, icon: '💔' },
      { label: 'Poop Incidents', val: stats.totalPoopsSteppedOn || 0, icon: '💩' },
      { label: 'Powerups Collected', val: stats.totalPowerupsCollected || 0, icon: '⚡' },
      { label: 'Crowns Collected', val: stats.totalCrownsCollected || 0, icon: '👑' },
      { label: 'Gems Collected', val: stats.totalGemsCollected || 0, icon: '💎' }
    ];

    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'stat-card';
      el.innerHTML = `
        <div class="stat-card-icon">${card.icon}</div>
        <div class="stat-card-value">${card.val}</div>
        <div class="stat-card-label">${card.label}</div>
      `;
      container.appendChild(el);
    });
  }

  showGameOver(score, distance, coins, result) {
    document.getElementById('go-score').innerText = Math.floor(score);
    
    // Read and display overall best score
    const currentBest = StatisticsManager.getStats().highestScore || 0;
    document.getElementById('go-best').innerText = currentBest;

    document.getElementById('go-distance').innerText = `${Math.floor(distance)}m`;
    document.getElementById('go-coins').innerText = coins;

    // Display Rank if High Score
    const rankVal = document.getElementById('go-rank');
    if (result.isNewHighScore) {
      rankVal.innerText = `#${result.rank}`;
      document.getElementById('hall-of-fame-banner').classList.remove('hidden');
      this.triggerConfetti();
    } else {
      rankVal.innerText = '-';
      document.getElementById('hall-of-fame-banner').classList.add('hidden');
    }

    this.showScreen('gameover');
  }

  triggerConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#ff69b4'];
    
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = `-20px`;
      
      const delay = Math.random() * 2;
      const duration = 2 + Math.random() * 2;
      
      piece.style.animationDelay = `${delay}s`;
      piece.style.animationDuration = `${duration}s`;
      container.appendChild(piece);
    }
  }
}
window.UIManager = UIManager;
