class BackgroundManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = 'light';
    
    this.width = window.innerWidth || 900;
    this.height = window.innerHeight || 450;
    
    this.clouds = [];
    this.butterflies = [];
    this.fairyDust = [];
    
    this.rainbowAlpha = 0.8;
    this.rainbowScale = 1.0;
    this.rainbowGrow = true;
    this.castleWindowFlicker = 0;

    this.initElements();
  }

  setTheme(theme) {
    this.theme = theme;
    this.initElements();
  }

  initElements() {
    const w = this.width;
    const h = this.height;

    // Populate clouds (translucent & layered)
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * w * 1.5,
        y: 20 + Math.random() * 90,
        speed: 0.08 + Math.random() * 0.15,
        scale: 0.6 + Math.random() * 0.8,
        opacity: 0.4 + Math.random() * 0.45
      });
    }

    // Populate butterflies
    this.butterflies = [];
    for (let i = 0; i < 5; i++) {
      this.butterflies.push({
        x: Math.random() * w,
        y: 200 + Math.random() * 120,
        speed: 0.8 + Math.random() * 1.2,
        size: 5 + Math.random() * 5,
        angle: Math.random() * Math.PI,
        wingPhase: 0,
        color: ['#ff758f', '#70e000', '#ffd166', '#a2d2ff', '#e0aaff'][i % 5]
      });
    }

    // Fairy dust sparkles
    this.fairyDust = [];
    for (let i = 0; i < 15; i++) {
      this.fairyDust.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.7,
        size: 1.5 + Math.random() * 2.5,
        speedY: -(0.2 + Math.random() * 0.4),
        speedX: -0.2 + Math.random() * 0.4,
        alpha: 0.3 + Math.random() * 0.6,
        phase: Math.random() * Math.PI
      });
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.initElements();
  }

  update(dt, speed, isReducedMotion = false) {
    const motionSpeed = isReducedMotion ? 0.08 : 1.0;
    const w = this.width;
    const h = this.height;
    
    // Move clouds
    this.clouds.forEach(c => {
      c.x -= (c.speed + speed * 0.04) * dt * 60 * motionSpeed;
      if (c.x < -200) {
        c.x = w + 100;
        c.y = 20 + Math.random() * 90;
      }
    });

    // Move butterflies
    this.butterflies.forEach(b => {
      b.x -= (b.speed + speed * 0.08) * dt * 60 * motionSpeed;
      b.y += Math.sin(b.angle) * 0.6 * motionSpeed;
      b.angle += 0.08 * motionSpeed;
      b.wingPhase += 0.25 * motionSpeed;
      if (b.x < -50) {
        b.x = w + 50;
        b.y = 200 + Math.random() * 120;
      }
    });

    // Move fairy dust sparkles
    this.fairyDust.forEach(d => {
      d.y += d.speedY * motionSpeed;
      d.x += d.speedX * motionSpeed;
      d.phase += 0.05 * motionSpeed;
      if (d.y < 0) {
        d.y = h * 0.7;
        d.x = Math.random() * w;
      }
    });

    // Window flicker animation
    this.castleWindowFlicker += dt;
    
    // Rainbow Shimmer
    if (!isReducedMotion) {
      if (this.rainbowGrow) {
        this.rainbowAlpha += 0.003 * dt * 60;
        if (this.rainbowAlpha >= 0.95) this.rainbowGrow = false;
      } else {
        this.rainbowAlpha -= 0.003 * dt * 60;
        if (this.rainbowAlpha <= 0.5) this.rainbowGrow = true;
      }
    }
  }

  draw(scrollOffset) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const groundY = h - 60;

    // 1. SKY GRADIENT (Smooth & Rich)
    ctx.save();
    let skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (this.theme === 'light') {
      skyGrad.addColorStop(0, '#4ea8de'); // Deep celestial blue
      skyGrad.addColorStop(0.4, '#90e0ef'); // Soft cyan
      skyGrad.addColorStop(0.75, '#caf0f8'); // Light horizontal cyan
      skyGrad.addColorStop(1, '#ffd1dc'); // Romantic soft pink horizon
    } else if (this.theme === 'night') {
      skyGrad.addColorStop(0, '#0b0c10'); // True deep space
      skyGrad.addColorStop(0.4, '#1f2833'); // Steel space
      skyGrad.addColorStop(0.8, '#2d1b4e'); // Purple horizons
      skyGrad.addColorStop(1, '#4a1070'); // Magenta rim
    } else if (this.theme === 'candy') {
      skyGrad.addColorStop(0, '#f7b6d2'); // Soft strawberry pink
      skyGrad.addColorStop(0.5, '#fbc5d8'); 
      skyGrad.addColorStop(0.85, '#ffe5ec'); // Cream horizon
      skyGrad.addColorStop(1, '#c5f6fa'); // Pastel mint green horizon
    } else if (this.theme === 'rainbow') {
      skyGrad.addColorStop(0, '#ffe5ec'); 
      skyGrad.addColorStop(0.3, '#ffeb3b'); // yellow splash
      skyGrad.addColorStop(0.65, '#e8f5e9'); // pastel green
      skyGrad.addColorStop(1, '#e0f7fa'); // pastel cyan
    } else {
      skyGrad.addColorStop(0, '#000000');
      skyGrad.addColorStop(1, '#000000');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // 2. CELESTIAL BODY (Sun/Moon/Candy Sun - Parallax 0.02)
    this.drawCelestialBody(scrollOffset * 0.02);

    // 3. NIGHT STARS OR SKY SPARKLES (Fairy Dust)
    this.drawFairyDust();

    // 4. RAINBOW LAYER (Glowing gradient arc - Parallax 0.05)
    if (this.theme !== 'retro') {
      this.drawBeautifulRainbow(scrollOffset * 0.05);
    }

    // 5. DISTANT HILLS LAYER 1 (Parallax 0.08)
    this.drawRollingHills(scrollOffset * 0.08, groundY, '#7bb87a', '#a6d9a5', 130, 400);

    // 6. DISTANT CASTLE (Parallax 0.15)
    this.drawAdvancedCastle(scrollOffset * 0.15, groundY);

    // 7. MIDGROUND HILLS LAYER 2 (Parallax 0.22)
    this.drawRollingHills(scrollOffset * 0.22, groundY, '#4c9f48', '#7ac477', 80, 280);

    // 8. CLOUDS (Parallax 0.12)
    this.drawFancyClouds();

    // 9. TREES & FLOWERS (Parallax 0.4)
    this.drawAdvancedTreesAndFlowers(scrollOffset * 0.4, groundY);

    // 10. BUTTERFLIES
    this.drawAnimatedButterflies();

    // 11. GROUND & FLOOR
    this.drawGround(scrollOffset, h);
  }

  drawCelestialBody(offset) {
    const ctx = this.ctx;
    const w = this.width;
    const x = (w * 0.78 - offset) % (w + 200);
    const cx = x < -100 ? x + w + 200 : x;
    const cy = 75;

    ctx.save();
    if (this.theme === 'light') {
      // Golden Glowing Sun
      ctx.shadowBlur = 30;
      ctx.shadowColor = 'rgba(254, 217, 37, 0.8)';
      ctx.fillStyle = '#fdd835';
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();

      // Outer halo
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(254, 217, 37, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.theme === 'night') {
      // Silver glowing crescent moon
      ctx.shadowBlur = 25;
      ctx.shadowColor = 'rgba(236, 240, 241, 0.6)';
      ctx.fillStyle = '#ecf0f1';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      // Mask to make crescent
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#090a1e'; // match sky top
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 4, 24, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.theme === 'candy') {
      // Pastel Pink Candy Sun
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255, 117, 143, 0.7)';
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();
      // White swirl line
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI, false);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFairyDust() {
    const ctx = this.ctx;
    ctx.save();
    
    if (this.theme === 'night' || this.theme === 'retro') {
      ctx.fillStyle = this.theme === 'retro' ? '#0f0' : '#ffffff';
      // Star twinkling
      for (let i = 0; i < 25; i++) {
        const starX = (Math.sin(i * 98765) * 0.5 + 0.5) * this.width;
        const starY = (Math.cos(i * 12345) * 0.5 + 0.5) * (this.height * 0.5);
        const shimmer = Math.abs(Math.sin(Date.now() * 0.002 + i)) * 2 + 1;
        ctx.fillRect(starX, starY, shimmer, shimmer);
      }
    } else {
      // Floating glowing fairy sparkles
      this.fairyDust.forEach(d => {
        const alphaPulse = d.alpha * (0.6 + Math.sin(d.phase) * 0.4);
        ctx.fillStyle = `rgba(255, 255, 255, ${alphaPulse})`;
        
        ctx.beginPath();
        // 4 pointed star shape
        ctx.moveTo(d.x, d.y - d.size * 1.5);
        ctx.lineTo(d.x + d.size * 0.4, d.y - d.size * 0.4);
        ctx.lineTo(d.x + d.size * 1.5, d.y);
        ctx.lineTo(d.x + d.size * 0.4, d.y + d.size * 0.4);
        ctx.lineTo(d.x, d.y + d.size * 1.5);
        ctx.lineTo(d.x - d.size * 0.4, d.y + d.size * 0.4);
        ctx.lineTo(d.x - d.size * 1.5, d.y);
        ctx.lineTo(d.x - d.size * 0.4, d.y - d.size * 0.4);
        ctx.closePath();
        ctx.fill();
      });
    }
    ctx.restore();
  }

  drawBeautifulRainbow(offset) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    
    ctx.save();
    ctx.globalAlpha = this.rainbowAlpha * 0.7;
    
    const rx = w * 0.35 - (offset % (w * 1.8));
    const ry = h - 60;
    const radius = 230;
    
    const rainbowColors = [
      'rgba(255, 75, 114, 0.8)',
      'rgba(255, 149, 0, 0.8)',
      'rgba(255, 209, 102, 0.8)',
      'rgba(6, 214, 160, 0.8)',
      'rgba(17, 138, 178, 0.8)',
      'rgba(131, 56, 236, 0.8)'
    ];
    
    ctx.lineWidth = 10;
    rainbowColors.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(rx, ry, radius + i * 9, Math.PI, 0, false);
      ctx.stroke();
    });
    
    ctx.restore();
  }

  drawRollingHills(offset, groundY, color1, color2, hillHeight, spacing) {
    const ctx = this.ctx;
    const w = this.width;
    
    ctx.save();
    
    // Create soft gradient for the hills
    let hillGrad = ctx.createLinearGradient(0, groundY - hillHeight, 0, groundY);
    
    if (this.theme === 'night') {
      hillGrad.addColorStop(0, '#101626');
      hillGrad.addColorStop(1, '#1b223c');
    } else if (this.theme === 'candy') {
      hillGrad.addColorStop(0, '#ec4899'); // strawberry-cream purple
      hillGrad.addColorStop(1, '#be185d');
    } else if (this.theme === 'retro') {
      hillGrad.addColorStop(0, '#000');
      hillGrad.addColorStop(1, '#000');
    } else {
      hillGrad.addColorStop(0, color1);
      hillGrad.addColorStop(1, color2);
    }
    
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.moveTo(-50, groundY);
    
    // Plot a series of smooth waves using sine curves
    const waveCount = Math.ceil(w / spacing) + 3;
    for (let i = -1; i < waveCount; i++) {
      const startX = i * spacing - (offset % spacing);
      const endX = startX + spacing;
      const controlY = groundY - hillHeight;
      
      // Bezier curve
      ctx.quadraticCurveTo(startX + spacing * 0.5, controlY, endX, groundY);
    }
    
    ctx.lineTo(w + 100, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawAdvancedCastle(offset, groundY) {
    const ctx = this.ctx;
    const w = this.width;
    
    const castleX = (w * 0.72 - offset) % (w * 1.8);
    const cx = castleX < -150 ? castleX + w * 1.8 : castleX;
    const cy = groundY;

    ctx.save();

    // Theme Color mappings
    let primary = '#e2bcf4';
    let secondary = '#d19cf0';
    let roofColor = '#ff5b8c';
    let lineStroke = '#321650';

    if (this.theme === 'night') {
      primary = '#2a2f4a';
      secondary = '#1f233b';
      roofColor = '#3e4870';
      lineStroke = '#0f111c';
    } else if (this.theme === 'candy') {
      primary = '#fdf2f8';
      secondary = '#fce7f3';
      roofColor = '#f43f5e';
      lineStroke = '#4c0519';
    } else if (this.theme === 'retro') {
      ctx.fillStyle = '#0f0';
      ctx.fillRect(cx - 50, cy - 90, 100, 90);
      ctx.restore();
      return;
    }

    ctx.fillStyle = primary;
    ctx.strokeStyle = lineStroke;
    ctx.lineWidth = 3.5;

    // 1. Castles Base Keep
    ctx.fillRect(cx - 55, cy - 70, 110, 70);
    ctx.strokeRect(cx - 55, cy - 70, 110, 70);

    // Parapets/Crenellations on keep
    ctx.fillStyle = secondary;
    for (let px = -55; px < 55; px += 22) {
      ctx.fillRect(cx + px, cy - 80, 12, 10);
      ctx.strokeRect(cx + px, cy - 80, 12, 10);
    }

    // 2. Left Tower
    ctx.fillStyle = primary;
    ctx.fillRect(cx - 75, cy - 110, 25, 110);
    ctx.strokeRect(cx - 75, cy - 110, 25, 110);
    // Left cone roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(-82 + cx, cy - 110);
    ctx.lineTo(-62 + cx, cy - 150);
    ctx.lineTo(-42 + cx, cy - 110);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Right Tower
    ctx.fillStyle = primary;
    ctx.fillRect(cx + 50, cy - 110, 25, 110);
    ctx.strokeRect(cx + 50, cy - 110, 25, 110);
    // Right cone roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(42 + cx, cy - 110);
    ctx.lineTo(62 + cx, cy - 150);
    ctx.lineTo(82 + cx, cy - 110);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Central Spire
    ctx.fillStyle = secondary;
    ctx.fillRect(cx - 18, cy - 130, 36, 60);
    ctx.strokeRect(cx - 18, cy - 130, 36, 60);
    // Spire Roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(-24 + cx, cy - 130);
    ctx.lineTo(cx, cy - 180);
    ctx.lineTo(24 + cx, cy - 130);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Waving Gold Flag
    const flagY = cy - 180;
    const wave = Math.sin(offset * 0.12) * 4;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(cx, flagY);
    ctx.lineTo(cx + 18, flagY + 4 + wave);
    ctx.lineTo(cx, flagY + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Glowing Windows
    const pulseLight = Math.sin(this.castleWindowFlicker * 5) > 0;
    ctx.fillStyle = pulseLight ? '#fff176' : '#ffd54f';
    
    // Left Tower Window
    ctx.fillRect(cx - 68, cy - 80, 10, 16);
    ctx.strokeRect(cx - 68, cy - 80, 10, 16);
    
    // Right Tower Window
    ctx.fillRect(cx + 58, cy - 80, 10, 16);
    ctx.strokeRect(cx + 58, cy - 80, 10, 16);

    // Keep Main Window
    ctx.fillRect(cx - 8, cy - 100, 16, 22);
    ctx.strokeRect(cx - 8, cy - 100, 16, 22);

    // 6. Draw Arch Doorway
    ctx.fillStyle = lineStroke;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, Math.PI, 0, false);
    ctx.lineTo(cx + 22, cy);
    ctx.lineTo(cx - 22, cy);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawFancyClouds() {
    const ctx = this.ctx;
    ctx.save();
    
    this.clouds.forEach(c => {
      ctx.globalAlpha = c.opacity;
      
      let cloudGrad = ctx.createLinearGradient(0, c.y - 20, 0, c.y + 20);
      if (this.theme === 'retro') {
        ctx.fillStyle = '#0f0';
      } else {
        cloudGrad.addColorStop(0, '#ffffff');
        cloudGrad.addColorStop(1, '#e0f2fe'); // soft sky blue bottom shadow
        ctx.fillStyle = cloudGrad;
      }

      // Draw stylized cartoon cloud chunks
      const cx = c.x;
      const cy = c.y;
      const r = 24 * c.scale;
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.7, cy - r * 0.35, r * 0.85, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.4, cy, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.7, cy + r * 0.3, r * 0.8, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  drawAdvancedTreesAndFlowers(offset, groundY) {
    const ctx = this.ctx;
    const w = this.width;
    
    ctx.save();

    const spacing = 180;
    for (let i = -1; i < w / spacing + 2; i++) {
      const tx = i * spacing - (offset % spacing);
      const ty = groundY;
      const wSin = Math.sin(Date.now() * 0.003 + i) * 3;

      if (this.theme === 'retro') {
        ctx.fillStyle = '#0f0';
        ctx.fillRect(tx - 4, ty - 32, 8, 32);
        ctx.fillRect(tx - 12, ty - 50, 24, 20);
        continue;
      }

      // DRAW PREMIUM TREE
      // Trunk (wood grain)
      ctx.fillStyle = '#7a5135';
      ctx.fillRect(tx - 5, ty - 36, 10, 36);
      
      // Leaves (detailed canopy with shadows)
      const leafGrad = ctx.createRadialGradient(tx, ty - 45, 5, tx, ty - 45, 25);
      
      if (this.theme === 'night') {
        leafGrad.addColorStop(0, '#1e293b');
        leafGrad.addColorStop(1, '#0f172a');
      } else if (this.theme === 'candy') {
        leafGrad.addColorStop(0, '#fbcfe8'); // candy floss tree
        leafGrad.addColorStop(1, '#ec4899');
      } else {
        leafGrad.addColorStop(0, '#4ad66d'); // glowing green
        leafGrad.addColorStop(1, '#1b8a3f'); // dark grass green
      }

      ctx.fillStyle = leafGrad;
      ctx.beginPath();
      ctx.arc(tx, ty - 45, 20, 0, Math.PI * 2);
      ctx.arc(tx - 12, ty - 55, 14, 0, Math.PI * 2);
      ctx.arc(tx + 12, ty - 55, 14, 0, Math.PI * 2);
      ctx.fill();

      // Red apples
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(tx - 8, ty - 42, 3.5, 0, Math.PI * 2);
      ctx.arc(tx + 8, ty - 48, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // DRAW FLOWERS & SHRUBS AT FOOT OF TREES
      ctx.fillStyle = '#e2bcf4'; // Purple bush
      ctx.beginPath();
      ctx.arc(tx - 12, ty - 4, 6, 0, Math.PI * 2);
      ctx.arc(tx + 12, ty - 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Blooming Flowers with stems waving
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx - 20, ty);
      ctx.quadraticCurveTo(tx - 20 + wSin, ty - 12, tx - 20 + wSin, ty - 14);
      ctx.stroke();

      // Flower petals
      ctx.fillStyle = '#e91e63'; // Bright hot pink flower petals
      ctx.beginPath();
      ctx.arc(tx - 20 + wSin, ty - 14, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd700'; // Gold core
      ctx.beginPath();
      ctx.arc(tx - 20 + wSin, ty - 14, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawAnimatedButterflies() {
    const ctx = this.ctx;
    ctx.save();
    
    this.butterflies.forEach(b => {
      const wingFlap = Math.abs(Math.sin(b.wingPhase)) * b.size;
      
      ctx.fillStyle = b.color;
      // Wing Left
      ctx.beginPath();
      ctx.ellipse(b.x - wingFlap/2 - 1, b.y, wingFlap, b.size, Math.PI/4, 0, Math.PI*2);
      ctx.fill();
      
      // Wing Right
      ctx.beginPath();
      ctx.ellipse(b.x + wingFlap/2 + 1, b.y, wingFlap, b.size, -Math.PI/4, 0, Math.PI*2);
      ctx.fill();

      // Tiny Body
      ctx.fillStyle = '#222222';
      ctx.fillRect(b.x - 1, b.y - b.size, 2, b.size * 1.5);
    });
    ctx.restore();
  }

  drawGround(offset, h) {
    const ctx = this.ctx;
    const w = this.width;
    const groundY = h - 60;

    ctx.save();

    // 1. Rich grass layer with small vertical grass blades/tufts
    ctx.fillStyle = this.theme === 'retro' ? '#0f0' : (this.theme === 'night' ? '#1b4d3e' : '#5dbf40');
    ctx.fillRect(0, groundY, w, 15);

    // Draw little grass blade details
    ctx.fillStyle = this.theme === 'retro' ? '#0f0' : (this.theme === 'night' ? '#2d6a4f' : '#82d35a');
    for (let x = -(offset % 30); x < w + 30; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x + 5, groundY - 4);
      ctx.lineTo(x + 8, groundY);
      ctx.fill();
    }

    // 2. Beautiful Floor below grass
    const brickW = 40;
    const brickH = 15;
    const brickOffset = offset % brickW;

    ctx.fillStyle = this.theme === 'retro' ? '#000' : (this.theme === 'night' ? '#18122B' : '#d2b48c');
    ctx.fillRect(0, groundY + 15, w, 45);

    // Draw bricks with drop shadow borders
    ctx.strokeStyle = this.theme === 'retro' ? '#0f0' : (this.theme === 'night' ? '#0b0813' : '#8b7355');
    ctx.lineWidth = 2.5;

    for (let row = 0; row < 3; row++) {
      const y = groundY + 15 + row * brickH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      const shift = row * 20 - brickOffset;
      for (let col = -1; col < w / brickW + 2; col++) {
        const x = col * brickW + shift;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + brickH);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
window.BackgroundManager = BackgroundManager;
