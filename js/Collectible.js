class Collectible {
  constructor(type, canvasWidth, groundY) {
    this.type = type; // 'heart', 'crown', 'star', 'gem'
    this.x = canvasWidth + 50;
    this.active = true;

    // Collectibles float above the ground
    const floatHeights = [groundY - 60, groundY - 100, groundY - 140];
    this.y = floatHeights[Math.floor(Math.random() * floatHeights.length)];
    
    this.width = 36;
    this.height = 36;
    
    this.animTime = 0;
    this.pulseScale = 1.0;
  }

  update(dt, baseSpeed, player) {
    this.x -= baseSpeed * dt * 60;

    // Magnet Attraction Force
    if (player.hasMagnet) {
      const px = player.x + player.width / 2;
      const py = player.y + player.height / 2;
      const dx = px - (this.x + this.width / 2);
      const dy = py - (this.y + this.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        const pullSpeed = 9.0;
        this.x += (dx / dist) * pullSpeed * dt * 60;
        this.y += (dy / dist) * pullSpeed * dt * 60;
      }
    }

    this.animTime += dt;
    this.pulseScale = 1.0 + Math.sin(this.animTime * 6) * 0.15;

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
    // Scale 1.5x to make the collectibles big and clear!
    ctx.scale(this.pulseScale * 1.5, this.pulseScale * 1.5);

    switch (this.type) {
      case 'heart':
        this.drawHeart(ctx, -12, -12, isHighContrast);
        break;
      case 'crown':
        this.drawCrown(ctx, -12, -12, isHighContrast);
        break;
      case 'star':
        this.drawStar(ctx, -12, -12, isHighContrast);
        break;
      case 'gem':
        this.drawGem(ctx, -12, -12, isHighContrast);
        break;
    }

    ctx.restore();
  }

  drawHeart(ctx, x, y, isHighContrast) {
    ctx.fillStyle = isHighContrast ? '#f00' : '#e74c3c';
    ctx.fillRect(x + 4, y, 6, 4);
    ctx.fillRect(x + 14, y, 6, 4);
    ctx.fillRect(x + 2, y + 4, 20, 6);
    ctx.fillRect(x + 4, y + 10, 16, 4);
    ctx.fillRect(x + 7, y + 14, 10, 4);
    ctx.fillRect(x + 10, y + 18, 4, 4);
  }

  drawCrown(ctx, x, y, isHighContrast) {
    ctx.fillStyle = isHighContrast ? '#ff0' : '#ffd700';
    ctx.fillRect(x + 2, y + 6, 3, 6);
    ctx.fillRect(x + 10, y + 2, 4, 10);
    ctx.fillRect(x + 19, y + 6, 3, 6);
    ctx.fillRect(x, y + 12, 24, 6);
    ctx.fillStyle = '#ff1493';
    ctx.fillRect(x + 5, y + 14, 3, 2);
    ctx.fillRect(x + 16, y + 14, 3, 2);
  }

  drawStar(ctx, x, y, isHighContrast) {
    ctx.fillStyle = isHighContrast ? '#fff' : '#f1c40f';
    ctx.fillRect(x + 10, y, 4, 4);
    ctx.fillRect(x + 6, y + 4, 12, 4);
    ctx.fillRect(x + 2, y + 8, 20, 4);
    ctx.fillRect(x + 6, y + 12, 12, 4);
    ctx.fillRect(x + 4, y + 16, 4, 6);
    ctx.fillRect(x + 16, y + 16, 4, 6);
  }

  drawGem(ctx, x, y, isHighContrast) {
    ctx.fillStyle = isHighContrast ? '#0ff' : '#9b59b6';
    ctx.fillRect(x + 9, y, 6, 4);
    ctx.fillRect(x + 5, y + 4, 14, 4);
    ctx.fillRect(x + 2, y + 8, 20, 4);
    ctx.fillRect(x + 5, y + 12, 14, 4);
    ctx.fillRect(x + 9, y + 16, 6, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 7, y + 6, 3, 3);
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
window.Collectible = Collectible;
