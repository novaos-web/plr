export default class AudioVisualizer {
  constructor(canvas, analyser, getAudioData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyser;
    this.getAudioData = getAudioData;
    this.width = canvas.width;
    this.height = canvas.height;
    this.particles = new Array(2000).fill().map(() => this.createParticle());
    this.thread = new Array(this.width).fill(this.height / 2);
  }

  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.3
    };
  }

  update() {
    const { totalEnergy, bassEnergy, highEnergy } = this.getAudioData();
    const threadHeight = this.height / 2;
    const amplitude = bassEnergy * 0.4 + totalEnergy * 0.1;

    for (let i = this.thread.length - 1; i > 0; i--) {
      this.thread[i] = this.thread[i - 1];
    }

    this.thread[0] = threadHeight + (Math.random() - 0.5) * amplitude * 2;

    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.thread[0]);
    for (let i = 1; i < this.thread.length; i++) {
      this.ctx.lineTo(i, this.thread[i]);
    }
    this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    for (let p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      this.ctx.fill();
    }
  }
}
