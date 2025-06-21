export default class AudioVisualizer {
  constructor(canvas, analyser, getAudioData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyser;
    this.getAudioData = getAudioData;

    this.particles = [];
    this.particleCount = 1500;
    this.maxSize = 20;

    this.width = canvas.width;
    this.height = canvas.height;

    this.createParticles();
  }

  createParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseSize: Math.random() * this.maxSize,
        size: 0,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }
  }

  update() {
    const { bassEnergy, highEnergy, totalEnergy } = this.getAudioData();

    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      const energyFactor = (bassEnergy + totalEnergy * 0.3) * 0.001;
      p.size = p.baseSize * energyFactor;

      p.alpha = Math.min(1, p.alpha + (highEnergy * 0.0005));
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (let p of this.particles) {
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(200, 200, 200, ${p.alpha})`);
      gradient.addColorStop(1, `rgba(200, 200, 200, 0)`);
      ctx.fillStyle = gradient;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
