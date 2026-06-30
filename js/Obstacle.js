class Obstacle {
  constructor(type, canvasWidth, groundY, difficulty) {
    this.type = type; // 'poop_small', 'poop_large', 'poop_triple', 'cactus', 'bird', 'mud', 'barrel'
    this.x = canvasWidth + 50;
    this.groundY = groundY;
    
    this.width = 30;
    this.height = 30;
    this.y = groundY - this.height;
    
    this.speedMultiplier = 1.0;
    this.animTime = 0;
    this.animFrame = 0;
    this.active = true;

    this.initType(difficulty);
  }

  initType(difficulty) {
    const isHighContrast = document.body.classList.contains('high-contrast');
    
    switch (this.type) {
      case 'poop_small':
        this.width = 44;
        this.height = 40;
        this.y = this.groundY - this.height;
        break;
      case 'poop_large':
        this.width = 62;
        this.height = 58;
        this.y = this.groundY - this.height;
        break;
      case 'poop_triple':
        this.width = 100;
        this.height = 46;
        this.y = this.groundY - this.height;
        break;
      case 'cactus':
        // Giant saguaro cactus!
        this.width = 44;
        this.height = 80;
        this.y = this.groundY - this.height;
        this.color = isHighContrast ? '#0f0' : '#2ecc71';
        break;
      case 'bird':
        this.width = 54;
        this.height = 38;
        // Fly at levels matching player's height and jump heights
        const heights = [this.groundY - 42, this.groundY - 78, this.groundY - 110];
        this.y = heights[Math.floor(Math.random() * heights.length)];
        this.color = isHighContrast ? '#f0f' : '#ff4757';
        this.speedMultiplier = 1.25;
        break;
      case 'mud':
        this.width = 90;
        this.height = 12;
        this.y = this.groundY - this.height; // Sits flat ON top of the grass, fully visible
        this.color = '#5c3a21';
        break;
      case 'barrel':
        this.width = 48;
        this.height = 48;
        this.y = this.groundY - this.height;
        this.color = '#d2b48c';
        break;
    }
  }

  update(dt, baseSpeed) {
    this.x -= baseSpeed * this.speedMultiplier * dt * 60;
    
    // Bird flap animation
    if (this.type === 'bird') {
      this.animTime += dt;
      if (this.animTime > 0.12) {
        this.animTime = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    }

    if (this.x < -this.width - 50) {
      this.active = false;
    }
  }

  draw(ctx) {
    const isHighContrast = document.body.classList.contains('high-contrast');
    ctx.save();

    const ox = this.x;
    const oy = this.y;
    const ow = this.width;
    const oh = this.height;

    switch (this.type) {
      case 'poop_small':
        this.drawPoopEmoji(ctx, ox, oy, ow, oh, isHighContrast);
        break;
      case 'poop_large':
        this.drawPoopEmoji(ctx, ox, oy, ow, oh, isHighContrast);
        break;
      case 'poop_triple':
        // 3 overlapping poop emojis next to each other
        const subW = ow * 0.45;
        const subH = oh * 0.85;
        this.drawPoopEmoji(ctx, ox, oy + oh * 0.15, subW, subH, isHighContrast);
        this.drawPoopEmoji(ctx, ox + ow * 0.28, oy, ow * 0.52, oh, isHighContrast);
        this.drawPoopEmoji(ctx, ox + ow * 0.62, oy + oh * 0.2, subW * 0.9, subH * 0.9, isHighContrast);
        break;
      case 'cactus':
        this.drawGiantCactus(ctx, ox, oy, ow, oh, isHighContrast);
        break;
      case 'bird':
        // Bird body
        ctx.fillStyle = this.color;
        ctx.fillRect(ox + 12, oy + 8, 28, 22);
        // Beak (yellow)
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(ox + 40, oy + 13, 10, 8);
        // Wing flap
        ctx.fillStyle = isHighContrast ? '#fff' : '#ff1493';
        if (this.animFrame === 0) {
          // Wing Up
          ctx.fillRect(ox + 18, oy - 8, 10, 16);
        } else {
          // Wing Down
          ctx.fillRect(ox + 18, oy + 18, 10, 16);
        }
        // Tail
        ctx.fillStyle = this.color;
        ctx.fillRect(ox, oy + 13, 12, 11);
        break;
      case 'mud':
        // Mud puddle shape
        ctx.fillStyle = isHighContrast ? '#ff0' : this.color;
        ctx.beginPath();
        ctx.ellipse(ox + ow/2, oy + oh/2, ow/2, oh/2, 0, 0, Math.PI * 2);
        ctx.fill();
        // small bubbles on mud
        ctx.fillStyle = '#3d2516';
        ctx.beginPath();
        ctx.arc(ox + ow * 0.3, oy + oh * 0.4, 2.5, 0, Math.PI * 2);
        ctx.arc(ox + ow * 0.7, oy + oh * 0.6, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'barrel':
        ctx.fillStyle = isHighContrast ? '#ff0' : '#a0522d';
        ctx.fillRect(ox, oy, ow, oh);
        // hoops
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(ox, oy + 8, ow, 5);
        ctx.fillRect(ox, oy + oh - 13, ow, 5);
        // wood vertical lines
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(ox + 10, oy, 4, oh);
        ctx.fillRect(ox + ow - 14, oy, 4, oh);
        break;
    }

    ctx.restore();
  }

  drawPoopEmoji(ctx, x, y, w, h, isHighContrast) {
    ctx.save();

    const brownGrad = ctx.createLinearGradient(x, y, x, y + h);
    brownGrad.addColorStop(0, '#9c6644');
    brownGrad.addColorStop(1, '#582f0e');

    ctx.fillStyle = isHighContrast ? '#ff0000' : brownGrad;
    
    // Bottom layer
    this.drawRoundedRect(ctx, x, y + h * 0.65, w, h * 0.35, 10);
    // Middle layer
    this.drawRoundedRect(ctx, x + w * 0.12, y + h * 0.32, w * 0.76, h * 0.36, 8);
    // Top layer
    this.drawRoundedRect(ctx, x + w * 0.25, y + h * 0.08, w * 0.5, h * 0.28, 6);
    
    // Swirl tip
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.08, w * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeSize = w * 0.16;
    const eyeY = y + h * 0.46;
    const leftEyeX = x + w * 0.36;
    const rightEyeX = x + w * 0.64;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(leftEyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(rightEyeX, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(leftEyeX + 1, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.arc(rightEyeX - 1, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.68, w * 0.16, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Buzzing fly
    ctx.fillStyle = '#222';
    const flyOffset = Math.sin(Date.now() * 0.04) * 3;
    ctx.fillRect(x + w * 0.5 + flyOffset, y - 8, 3, 2);

    ctx.restore();
  }

  drawGiantCactus(ctx, x, y, w, h, isHighContrast) {
    ctx.save();
    
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#1e5f37';
    ctx.lineWidth = 3;

    // Main Center Trunk
    const trunkW = w * 0.36;
    const trunkX = x + (w - trunkW) / 2;
    this.drawRoundedRect(ctx, trunkX, y, trunkW, h, 6);
    ctx.strokeRect(trunkX, y, trunkW, h);

    // Left Arm
    const armW = w * 0.28;
    const armH = h * 0.38;
    const armY = y + h * 0.28;
    ctx.fillRect(x, armY, armW, h * 0.16); // Horizontal part
    ctx.strokeRect(x, armY, armW, h * 0.16);

    ctx.fillRect(x, armY - armH * 0.6, armW * 0.6, armH); // Vertical part
    ctx.strokeRect(x, armY - armH * 0.6, armW * 0.6, armH);

    // Right Arm
    const rightArmX = x + w - armW;
    const rightArmY = y + h * 0.44;
    ctx.fillRect(rightArmX, rightArmY, armW, h * 0.16); // Horizontal part
    ctx.strokeRect(rightArmX, rightArmY, armW, h * 0.16);

    ctx.fillRect(x + w - armW * 0.6, rightArmY - armH * 0.6, armW * 0.6, armH); // Vertical part
    ctx.strokeRect(x + w - armW * 0.6, rightArmY - armH * 0.6, armW * 0.6, armH);

    // Clean overlap fills to merge lines
    ctx.fillStyle = this.color;
    ctx.fillRect(trunkX + 1, y + 2, trunkW - 2, h - 4);
    ctx.fillRect(x + 1, armY + 1, armW * 1.5, h * 0.16 - 2);
    ctx.fillRect(rightArmX - 5, rightArmY + 1, armW * 1.5, h * 0.16 - 2);

    // Spines (needles)
    ctx.fillStyle = '#000000';
    ctx.fillRect(trunkX + 6, y + 10, 2, 4);
    ctx.fillRect(trunkX + trunkW - 8, y + 28, 2, 4);
    ctx.fillRect(trunkX + 8, y + 50, 2, 4);
    ctx.fillRect(x + 4, armY - 4, 2, 4);
    ctx.fillRect(x + w - 6, rightArmY - 8, 2, 4);

    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  getHitbox() {
    switch (this.type) {
      case 'mud':
        return { x: this.x + 6, y: this.y, width: this.width - 12, height: this.height };
      case 'cactus':
        return { x: this.x + 8, y: this.y + 4, width: this.width - 16, height: this.height - 4 };
      case 'bird':
        return { x: this.x + 6, y: this.y + 6, width: this.width - 12, height: this.height - 12 };
      default:
        return { x: this.x + 3, y: this.y + 3, width: this.width - 6, height: this.height - 3 };
    }
  }
}
window.Obstacle = Obstacle;
