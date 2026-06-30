class Player {
  constructor(canvas, logicalGroundY) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Physics & Position (Big & Visible!)
    this.width = 60;
    this.height = 90;
    this.x = 90;
    // Use the logically-correct groundY passed in (not canvas.height which is DPR-scaled)
    this.groundY = logicalGroundY !== undefined ? logicalGroundY : (window.innerHeight - 60);
    this.y = this.groundY - this.height;
    
    this.vy = 0;
    this.gravity = 0.55;
    this.jumpForce = -13.5;
    this.doubleJumpForce = -11.5;
    this.terminalVelocity = 14;

    // States
    this.state = 'RUNNING'; // RUNNING, JUMPING, DUCKING, CRYING, VICTORY, IDLE
    this.isGrounded = true;
    this.doubleJumpAvailable = false;
    this.hasDoubleJumpPowerup = false;
    this.hasWings = false;
    this.hasMagnet = false;
    this.hasShield = false;
    
    // Poop mechanic
    this.isDirty = false;
    this.dirtyTimer = 0;
    this.footprintTimer = 0;
    this.footprints = [];

    // Invincibility
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.flickerTimer = 0;
    
    // Animation
    this.animFrame = 0;
    this.animTime = 0;
    this.blinkTimer = 0;

    // Speech bubble
    this.speechBubble = null; // { text, timer, color, emoji }
  }

  reset(canvasHeight) {
    this.groundY = canvasHeight - 60;
    this.width = 60;
    this.height = 90;
    this.y = this.groundY - this.height;
    this.vy = 0;
    this.state = 'RUNNING';
    this.isGrounded = true;
    this.doubleJumpAvailable = false;
    this.hasDoubleJumpPowerup = false;
    this.hasWings = false;
    this.hasMagnet = false;
    this.hasShield = false;
    this.isDirty = false;
    this.dirtyTimer = 0;
    this.footprints = [];
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.flickerTimer = 0;
    this.speechBubble = null;
  }

  jump() {
    if (this.state === 'CRYING') return false;

    if (this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.state = 'JUMPING';
      this.doubleJumpAvailable = this.hasDoubleJumpPowerup || this.hasWings;
      return true;
    } else if (this.doubleJumpAvailable) {
      this.vy = this.doubleJumpForce;
      this.doubleJumpAvailable = false;
      return true;
    }
    return false;
  }

  duck() {
    if (this.isGrounded && this.state !== 'CRYING') {
      this.state = 'DUCKING';
      this.height = 54; // shrink height hitbox
    }
  }

  unduck() {
    if (this.state === 'DUCKING') {
      this.state = 'RUNNING';
      this.height = 90; // restore height
      this.y = this.groundY - this.height;
    }
  }

  triggerPoopStep() {
    this.isDirty = true;
    this.dirtyTimer = 3.0; // 3 seconds penalty
    this.state = 'CRYING';
    
    // Reset heights if ducking
    this.height = 90;
    this.y = this.groundY - this.height;
  }

  setInvincible(duration) {
    this.isInvincible = true;
    this.invincibilityTimer = duration;
  }

  // Show a speech bubble above the princess
  say(text, color = '#fff', duration = 2.0) {
    this.speechBubble = { text, color, timer: duration };
  }

  update(dt, gameSpeed, particleSystem) {
    // 1. Speech bubble timer
    if (this.speechBubble) {
      this.speechBubble.timer -= dt;
      if (this.speechBubble.timer <= 0) this.speechBubble = null;
    }

    // 2. Other timers
    if (this.isDirty) {
      this.dirtyTimer -= dt;
      if (this.dirtyTimer <= 0) {
        this.isDirty = false;
        if (this.state === 'CRYING') {
          this.state = 'RUNNING';
        }
      }

      // Drop footprints
      this.footprintTimer += dt;
      if (this.footprintTimer > 0.15 && this.isGrounded && this.state !== 'DUCKING') {
        this.footprintTimer = 0;
        this.footprints.push({
          x: this.x + 12,
          y: this.groundY - 2,
          life: 1.0
        });
      }
    }

    // Update Footprints life
    this.footprints.forEach(fp => {
      fp.x -= gameSpeed * dt * 60;
      fp.life -= dt * 0.4;
    });
    this.footprints = this.footprints.filter(fp => fp.life > 0 && fp.x > -50);

    if (this.isInvincible) {
      this.invincibilityTimer -= dt;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
      }
    }

    // 2. Physics & Gravity
    let currentGravity = this.gravity;
    if (this.hasWings && this.vy > 0) {
      currentGravity = this.gravity * 0.35; // glide slowly if wings active
    }

    if (!this.isGrounded) {
      this.vy += currentGravity * dt * 60;
      if (this.vy > this.terminalVelocity) {
        this.vy = this.terminalVelocity;
      }
      this.y += this.vy * dt * 60;

      // Ground Check
      const curFloor = this.groundY - this.height;
      if (this.y >= curFloor) {
        this.y = curFloor;
        this.vy = 0;
        this.isGrounded = true;
        if (this.state === 'JUMPING') {
          this.state = 'RUNNING';
          if (particleSystem) {
            particleSystem.spawnDust(this.x + 10, this.groundY);
            particleSystem.spawnDust(this.x + 40, this.groundY);
          }
        }
      }
    }

    // 3. Ambient Animations
    this.animTime += dt;
    if (this.animTime > 0.08) {
      this.animTime = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Crying tear particles
    if (this.state === 'CRYING' && particleSystem && Math.random() < 0.3) {
      particleSystem.spawnTears(this.x + 36, this.y + 24);
      particleSystem.spawnTears(this.x + 24, this.y + 24);
    }
  }

  draw(ctx) {
    const isHighContrast = document.body.classList.contains('high-contrast');
    
    // Draw Footprints
    ctx.save();
    this.footprints.forEach(fp => {
      ctx.fillStyle = `rgba(139, 90, 43, ${fp.life})`; // Rich Mud footprint
      ctx.beginPath();
      ctx.arc(fp.x, fp.y + 1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fp.x - 4, fp.y + 2, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Invincibility flickering effect
    if (this.isInvincible) {
      this.flickerTimer += 1;
      if (this.flickerTimer % 4 < 2) {
        this.drawSpecialEffects(ctx);
        return; 
      }
    }

    ctx.save();
    
    const px = this.x;
    const py = this.y;
    const pw = this.width;
    const ph = this.height;

    // Running bounce offset
    const bounceOffset = (this.state === 'RUNNING' && this.isGrounded) ? Math.sin(this.animFrame * Math.PI / 2) * 3 : 0;
    const drawingY = py + bounceOffset;

    // Draw Hair Behind Head
    ctx.fillStyle = '#5c4033';
    ctx.beginPath();
    ctx.arc(px + pw/2, drawingY + ph * 0.28, 18, 0, Math.PI * 2);
    ctx.fill();

    // 1. DRESS (Pink flowing princess gown)
    const baseDressColor = isHighContrast ? '#ff0080' : '#ff69b4';
    const darkDressColor = isHighContrast ? '#c00060' : '#ff4b8c';
    const dirtyDressColor = '#946650';

    ctx.fillStyle = baseDressColor;
    
    const skirtY = drawingY + (this.state === 'DUCKING' ? 24 : 44);
    const skirtH = this.state === 'DUCKING' ? 28 : 44;
    
    // Draw flowing rounded dress path
    ctx.beginPath();
    ctx.moveTo(px + 14, skirtY);
    ctx.quadraticCurveTo(px + 2, skirtY + skirtH * 0.4, px + 2, skirtY + skirtH);
    ctx.lineTo(px + pw - 2, skirtY + skirtH);
    ctx.quadraticCurveTo(px + pw - 2, skirtY + skirtH * 0.4, px + pw - 14, skirtY);
    ctx.closePath();
    ctx.fill();

    // Draw gown overlay details/folds
    ctx.fillStyle = darkDressColor;
    ctx.beginPath();
    ctx.moveTo(px + 22, skirtY);
    ctx.lineTo(px + 16, skirtY + skirtH);
    ctx.lineTo(px + 24, skirtY + skirtH);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px + 38, skirtY);
    ctx.lineTo(px + 44, skirtY + skirtH);
    ctx.lineTo(px + 36, skirtY + skirtH);
    ctx.closePath();
    ctx.fill();

    // White puff sleeves
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px + 12, drawingY + (this.state === 'DUCKING' ? 22 : 36), 8, 0, Math.PI * 2);
    ctx.arc(px + pw - 12, drawingY + (this.state === 'DUCKING' ? 22 : 36), 8, 0, Math.PI * 2);
    ctx.fill();

    // 2. MUD DIRT MARKS (If dirty)
    if (this.isDirty) {
      ctx.fillStyle = dirtyDressColor;
      ctx.beginPath();
      ctx.arc(px + 10, skirtY + skirtH - 10, 5, 0, Math.PI * 2);
      ctx.arc(px + 28, skirtY + skirtH - 6, 7, 0, Math.PI * 2);
      ctx.arc(px + 45, skirtY + skirtH - 14, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. SKIN (Round face & neck)
    ctx.fillStyle = '#ffdbac';
    const headX = px + pw/2;
    const headY = drawingY + (this.state === 'DUCKING' ? 14 : 24);
    const headRadius = 14;
    ctx.beginPath();
    ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillRect(headX - 4, headY + 9, 8, 8);

    // 4. HAIR FRONT (Bangs & curls)
    ctx.fillStyle = '#5c4033';
    ctx.beginPath();
    ctx.arc(headX - 8, headY - 8, 8, 0, Math.PI * 2);
    ctx.arc(headX + 8, headY - 8, 8, 0, Math.PI * 2);
    ctx.arc(headX, headY - 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(headX - 16, headY - 3, 5, 18);
    ctx.fillRect(headX + 11, headY - 3, 5, 18);

    // 5. CROWN (Golden crown)
    ctx.fillStyle = isHighContrast ? '#ffff00' : '#ffd700';
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

    // 6. EYES & EXPRESSIONS
    const eyeCenterY = headY - 1;
    const eyeLX = headX - 6;
    const eyeRX = headX + 6;

    if (this.state === 'CRYING') {
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

      // Tear drops
      ctx.fillStyle = '#00bfff';
      ctx.beginPath();
      ctx.arc(eyeLX, eyeCenterY + 8, 4, 0, Math.PI * 2);
      ctx.arc(eyeRX, eyeCenterY + 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Sobbing mouth
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(headX, headY + 6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.state === 'DUCKING') {
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(eyeLX, eyeCenterY, 2.5, 0, Math.PI * 2);
      ctx.arc(eyeRX, eyeCenterY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ff4b8c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(headX, headY + 5, 4, 0, Math.PI, false);
      ctx.stroke();
    } else if (this.state === 'VICTORY') {
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(eyeLX, eyeCenterY + 1, 4, Math.PI, 0, false);
      ctx.arc(eyeRX, eyeCenterY + 1, 4, Math.PI, 0, false);
      ctx.stroke();

      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(headX, headY + 5, 5, 0, Math.PI, false);
      ctx.closePath();
      ctx.fill();
    } else {
      // Normal cartoon eyes
      ctx.fillStyle = '#222222';
      ctx.beginPath();
      ctx.arc(eyeLX, eyeCenterY, 3.5, 0, Math.PI * 2);
      ctx.arc(eyeRX, eyeCenterY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eyeLX - 1, eyeCenterY - 2.5, 2, 2);
      ctx.fillRect(eyeRX - 1, eyeCenterY - 2.5, 2, 2);

      ctx.fillStyle = 'rgba(255, 182, 193, 0.75)';
      ctx.beginPath();
      ctx.arc(eyeLX - 5, eyeCenterY + 5, 3, 0, Math.PI * 2);
      ctx.arc(eyeRX + 5, eyeCenterY + 5, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ff4b8c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(headX, headY + 4, 4, 0, Math.PI, false);
      ctx.stroke();
    }

    // 7. ARMS
    ctx.fillStyle = '#ffdbac';
    const armY = drawingY + (this.state === 'DUCKING' ? 32 : 44);
    if (this.state === 'RUNNING') {
      const armSwing = Math.sin(this.animFrame * Math.PI / 2) * 10;
      ctx.fillRect(px + 8, armY, 5, 12 + armSwing);
      ctx.fillRect(px + pw - 13, armY, 5, 12 - armSwing);
    } else if (this.state === 'CRYING') {
      ctx.fillRect(headX - 11, headY + 3, 6, 6);
      ctx.fillRect(headX + 5, headY + 3, 6, 6);
    } else {
      ctx.fillRect(px + 8, armY, 5, 15);
      ctx.fillRect(px + pw - 13, armY, 5, 15);
    }

    // 8. LEGS
    ctx.fillStyle = '#ffffff';
    const legW = 8;
    const legH = this.state === 'DUCKING' ? 0 : 10;
    const legY = py + ph - legH;
    
    if (legH > 0) {
      if (this.state === 'RUNNING') {
        const cycle = this.animFrame % 4;
        if (cycle === 0) {
          ctx.fillRect(px + 14, legY, legW, legH);
          ctx.fillRect(px + pw - 22, legY - 3, legW, legH);
        } else if (cycle === 1) {
          ctx.fillRect(px + 16, legY - 2, legW, legH);
          ctx.fillRect(px + pw - 24, legY, legW, legH);
        } else if (cycle === 2) {
          ctx.fillRect(px + 18, legY - 4, legW, legH);
          ctx.fillRect(px + pw - 26, legY, legW, legH);
        } else {
          ctx.fillRect(px + 14, legY, legW, legH);
          ctx.fillRect(px + pw - 22, legY - 1, legW, legH);
        }
      } else {
        ctx.fillRect(px + 16, legY, legW, legH);
        ctx.fillRect(px + pw - 24, legY, legW, legH);
      }
      
      // Pink Shoes
      ctx.fillStyle = '#ff1493';
      ctx.fillRect(px + 13, py + ph - 4, 10, 4);
      ctx.fillRect(px + pw - 25, py + ph - 4, 10, 4);
    }

    ctx.restore();

    this.drawSpecialEffects(ctx);
  }

  drawSpecialEffects(ctx) {
    const px = this.x;
    const py = this.y;
    const pw = this.width;
    const ph = this.height;

    // Rainbow Shield effect
    if (this.hasShield) {
      ctx.save();
      const shieldGlow = ctx.createRadialGradient(px + pw/2, py + ph/2, pw/2, px + pw/2, py + ph/2, pw * 1.1);
      shieldGlow.addColorStop(0, 'rgba(135,206,235,0.1)');
      shieldGlow.addColorStop(0.7, 'rgba(255,105,180,0.3)');
      shieldGlow.addColorStop(1, 'rgba(255,215,0,0.6)');
      
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3.5;
      ctx.fillStyle = shieldGlow;
      
      ctx.beginPath();
      ctx.arc(px + pw/2, py + ph/2, pw * 1.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Wings powerup effect
    if (this.hasWings) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeStyle = '#87ceeb';
      ctx.lineWidth = 2.5;

      const flap = Math.sin(this.animTime * 15) * 8;
      
      // Left Wing
      ctx.beginPath();
      ctx.moveTo(px + 2, py + ph * 0.4);
      ctx.quadraticCurveTo(px - 30, py + ph * 0.2 + flap, px - 18, py + ph * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(px + pw - 2, py + ph * 0.4);
      ctx.quadraticCurveTo(px + pw + 30, py + ph * 0.2 + flap, px + pw + 18, py + ph * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Magnet ring effect
    if (this.hasMagnet) {
      ctx.save();
      ctx.strokeStyle = '#87ceeb';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(px + pw/2, py + ph/2, 100, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw speech bubble on top of everything
    if (this.speechBubble) {
      this.drawSpeechBubble(ctx);
    }
  }

  drawSpeechBubble(ctx) {
    const bubble = this.speechBubble;
    const px = this.x + this.width / 2;  // center above princess
    const py = this.y - 14;              // just above the head

    ctx.save();

    // Measure text
    ctx.font = 'bold 15px Nunito, Arial, sans-serif';
    const textW = ctx.measureText(bubble.text).width;
    const pad = 10;
    const bw = textW + pad * 2;
    const bh = 28;
    const bx = px - bw / 2;
    const by = py - bh;
    const r = 10; // corner radius
    const tailH = 8;

    // Fade based on timer (fade out last 0.4s)
    const alpha = Math.min(1, bubble.timer / 0.4);
    ctx.globalAlpha = Math.max(0, alpha);

    // Bubble background
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = bubble.color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + bw - r, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
    ctx.lineTo(bx + bw, by + bh - r);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
    // tail
    ctx.lineTo(px + 6, by + bh);
    ctx.lineTo(px, by + bh + tailH);
    ctx.lineTo(px - 6, by + bh);
    ctx.lineTo(bx + r, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
    ctx.lineTo(bx, by + r);
    ctx.quadraticCurveTo(bx, by, bx + r, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#222';
    ctx.font = 'bold 15px Nunito, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bubble.text, px, by + bh / 2);

    ctx.restore();
  }

  getHitbox() {
    if (this.state === 'DUCKING') {
      return {
        x: this.x + 8,
        y: this.y + 14,
        width: this.width - 16,
        height: this.height - 14
      };
    }
    return {
      x: this.x + 10,
      y: this.y + 8,
      width: this.width - 20,
      height: this.height - 10
    };
  }
}
window.Player = Player;
