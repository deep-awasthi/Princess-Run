class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#fff';
    this.size = 2;
    this.alpha = 1;
    this.decay = 0.02;
    this.gravity = 0;
    this.active = false;
    this.shape = 'circle'; // circle, square, star
  }

  init(x, y, vx, vy, color, size, decay, gravity = 0, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.alpha = 1;
    this.decay = decay;
    this.gravity = gravity;
    this.shape = shape;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vy += this.gravity * dt * 60;
    this.alpha -= this.decay * dt * 60;
    if (this.alpha <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'square') {
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    } else if (this.shape === 'star') {
      // Small 4-point pixel star
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 6, this.size, this.size / 3);
      ctx.fillRect(this.x - this.size / 6, this.y - this.size / 2, this.size / 3, this.size);
    }
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.poolSize = 500;
    this.pool = [];
    for (let i = 0; i < this.poolSize; i++) {
      this.pool.push(new Particle());
    }
  }

  getParticle() {
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    // Return a new particle if pool is exhausted
    const p = new Particle();
    this.pool.push(p);
    this.poolSize++;
    return p;
  }

  spawn(x, y, vx, vy, color, size, decay, gravity = 0, shape = 'circle') {
    const p = this.getParticle();
    p.init(x, y, vx, vy, color, size, decay, gravity, shape);
  }

  // Preset Emitters
  spawnDust(x, y) {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const vx = -1 - Math.random() * 2;
      const vy = -0.5 - Math.random() * 1;
      this.spawn(x, y, vx, vy, 'rgba(255, 255, 255, 0.4)', 3 + Math.random() * 3, 0.04, -0.02);
    }
  }

  spawnSparkles(x, y, color = '#ffd700', count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.spawn(x, y, vx, vy, color, 4 + Math.random() * 4, 0.03, 0, 'star');
    }
  }

  spawnCoinBurst(x, y) {
    const count = 12;
    const colors = ['#ffd700', '#ffeb3b', '#fff9c4'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 1.5; // push up slightly
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawn(x, y, vx, vy, color, 5 + Math.random() * 5, 0.02, 0.1, 'circle');
    }
  }

  spawnConfetti(x, y) {
    const count = 40;
    const colors = ['#ff69b4', '#ffd700', '#87ceeb', '#9b59b6', '#2ecc71', '#ff1493'];
    for (let i = 0; i < count; i++) {
      const vx = -3 + Math.random() * 6;
      const vy = -4 - Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawn(x, y, vx, vy, color, 6 + Math.random() * 6, 0.015, 0.15, 'square');
    }
  }

  spawnPoopSplash(x, y) {
    const count = 15;
    const colors = ['#8b5a2b', '#a0522d', '#cd853f'];
    for (let i = 0; i < count; i++) {
      const vx = -2 + Math.random() * 4;
      const vy = -3 - Math.random() * 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawn(x, y, vx, vy, color, 4 + Math.random() * 6, 0.03, 0.2, 'circle');
    }
  }

  spawnTears(x, y) {
    // Water droplets spraying out from princess's face when crying
    const vx = -1 - Math.random() * 3;
    const vy = -2 - Math.random() * 2;
    this.spawn(x, y, vx, vy, '#00bfff', 3 + Math.random() * 3, 0.04, 0.15, 'circle');
  }

  update(dt) {
    for (let i = 0; i < this.poolSize; i++) {
      if (this.pool[i].active) {
        this.pool[i].update(dt);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.poolSize; i++) {
      if (this.pool[i].active) {
        this.pool[i].draw(ctx);
      }
    }
  }
}
window.ParticleSystem = ParticleSystem;
