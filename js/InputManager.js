class InputManager {
  constructor() {
    this.keys = {};
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeThreshold = 30; // Min px to trigger swipe

    this.onJump = null;
    this.onDuck = null;
    this.onUnduck = null;
    this.onPause = null;
    this.onRestart = null;

    this.bindEvents();
  }

  bindEvents() {
    // Keyboard Listeners
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      this.keys[code] = true;

      // Handle direct actions
      if (code === 'Space' || code === 'ArrowUp') {
        if (this.onJump) this.onJump();
      }
      if (code === 'ArrowDown') {
        if (this.onDuck) this.onDuck();
      }
      if (code === 'KeyP') {
        if (this.onPause) this.onPause();
      }
      if (code === 'KeyR') {
        if (this.onRestart) this.onRestart();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      this.keys[code] = false;

      if (code === 'ArrowDown') {
        if (this.onUnduck) this.onUnduck();
      }
    });

    // Touch Listeners
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('button') || e.target.closest('.hud-btn') || e.target.closest('input') || e.target.closest('select')) {
        return; // Let native button/select click handle it
      }
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.target.closest('button') || e.target.closest('.hud-btn') || e.target.closest('input') || e.target.closest('select')) {
        return;
      }
      const touch = e.changedTouches[0];
      const diffX = touch.clientX - this.touchStartX;
      const diffY = touch.clientY - this.touchStartY;

      // Detect Swipe Down
      if (diffY > this.swipeThreshold && Math.abs(diffY) > Math.abs(diffX)) {
        if (this.onDuck) this.onDuck();
        // Wait a short time then unduck automatically for mobile comfort
        setTimeout(() => {
          if (this.onUnduck) this.onUnduck();
        }, 600);
      } else {
        // Simple tap -> Jump
        if (this.onJump) this.onJump();
      }
    }, { passive: true });
  }

  isDuckPressed() {
    return !!(this.keys['ArrowDown'] || this.keys['KeyS']);
  }
}
window.InputManager = InputManager;
