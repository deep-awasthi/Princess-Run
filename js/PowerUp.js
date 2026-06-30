class PowerUp {
  constructor(type, canvasWidth, groundY) {
    this.type = type; // 'shield', 'double_jump', 'wings', 'slow_mo', 'magnet', 'speed_boost'
    this.x = canvasWidth + 50;
    this.active = true;

    // Powerups float in standard high levels
    const heights = [groundY - 60, groundY - 110];
    this.y = heights[Math.floor(Math.random() * heights.length)];
    
    this.width = 40;
    this.height = 40;

    this.animTime = 0;
    this.pulseScale = 1.0;
  }

  update(dt, baseSpeed, player) {
    this.x -= baseSpeed * dt * 60;

    // Powerups are also attracted by Magnet!
    if (player.hasMagnet) {
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const dx = px - (this.x + this.width / 2);
      const dy = py - (this.y + this.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        const pullSpeed = 8.5;
        this.x += (dx / dist) * pullSpeed * dt * 60;
        this.y += (dy / dist) * pullSpeed * dt * 60;
      }
    }

    this.animTime += dt;
    this.pulseScale = 1.0 + Math.sin(this.animTime * 8) * 0.12;

    if (this.x < -this.width - 50) {
      this.active = false;
    }
  }

  draw(ctx) {
    const isHighContrast = document.body.classList.contains('high-contrast');
    ctx.save();
    
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.translate(cx, cy);
    // Scale 1.5x to make the icons big and clear, with no bubbles!
    ctx.scale(this.pulseScale * 1.5, this.pulseScale * 1.5);

    // Draw the specific powerup icon directly (NO background bubbles!)
    switch (this.type) {
      case 'shield':
        this.drawShieldIcon(ctx, isHighContrast);
        break;
      case 'double_jump':
        this.drawShoeIcon(ctx, isHighContrast);
        break;
      case 'wings':
        this.drawWingIcon(ctx, isHighContrast);
        break;
      case 'slow_mo':
        this.drawClockIcon(ctx, isHighContrast);
        break;
      case 'magnet':
        this.drawMagnetIcon(ctx, isHighContrast);
        break;
      case 'speed_boost':
        this.drawLightningIcon(ctx, isHighContrast);
        break;
    }

    ctx.restore();
  }

  drawShieldIcon(ctx, isHighContrast) {
    ctx.fillStyle = isHighContrast ? '#ff0' : '#3498db';
    ctx.fillRect(-6, -8, 12, 10);
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(0, 8);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();
  }

  drawShoeIcon(ctx, isHighContrast) {
    ctx.fillStyle = isHighContrast ? '#f0f' : '#ff758f';
    ctx.fillRect(-8, -4, 16, 8);
    ctx.fillRect(0, -8, 8, 4);
    // small wings on shoe
    ctx.fillStyle = '#fff';
    ctx.fillRect(-12, -8, 4, 4);
    ctx.fillRect(-10, -4, 4, 4);
  }

  drawWingIcon(ctx, isHighContrast) {
    ctx.fillStyle = isHighContrast ? '#fff' : '#e0f7fa';
    ctx.strokeStyle = '#00bfff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-4, 0, 6, 0, Math.PI * 2);
    ctx.arc(4, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawClockIcon(ctx, isHighContrast) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = isHighContrast ? '#ff0' : '#e67e22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    // Clock hands
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -5);
    ctx.moveTo(0, 0);
    ctx.lineTo(3, 1);
    ctx.stroke();
  }

  drawMagnetIcon(ctx, isHighContrast) {
    ctx.strokeStyle = isHighContrast ? '#f00' : '#e74c3c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -2, 6, 0, Math.PI, false);
    ctx.stroke();
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(-8, -6, 4, 3);
    ctx.fillRect(4, -6, 4, 3);
  }

  drawLightningIcon(ctx, isHighContrast) {
    ctx.fillStyle = isHighContrast ? '#ff0' : '#ffd700';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-3, 10);
    ctx.lineTo(6, -1);
    ctx.lineTo(1, -1);
    ctx.closePath();
    ctx.fill();
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}
window.PowerUp = PowerUp;
