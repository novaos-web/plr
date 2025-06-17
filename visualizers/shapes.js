export default class AudioVisualizer {
    constructor(canvas, analyser, getAudioData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.analyser = analyser;
        this.getAudioData = getAudioData;

        this.width = canvas.width;
        this.height = canvas.height;

        this.particles = [];
        this.lastBeat = 0;
        this.beatThreshold = 0.65;
        this.beatCooldown = 400;
        this.maxParticles = 100;
    }

    update() {
        const now = performance.now();
        const { bassEnergy } = this.getAudioData();

        if (bassEnergy > this.beatThreshold && now - this.lastBeat > this.beatCooldown) {
            this.lastBeat = now;
            const sides = Math.max(3, 8 - Math.floor(bassEnergy * 5));
            const count = 1 + Math.floor(bassEnergy * 2);
            for (let i = 0; i < count; i++) {
                if (this.particles.length >= this.maxParticles) break;
                const angle = Math.random() * Math.PI * 2;
                this.particles.push({
                    x: this.width / 2,
                    y: this.height / 2,
                    radius: 15 + Math.random() * 10,
                    sides,
                    angle,
                    speedX: Math.cos(angle) * (0.5 + Math.random() * 1),
                    speedY: Math.sin(angle) * (0.5 + Math.random() * 1),
                    alpha: 1,
                    decay: 0.005 + Math.random() * 0.01
                });
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.alpha -= p.decay;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (const p of this.particles) {
            const step = (Math.PI * 2) / p.sides;
            this.ctx.beginPath();
            for (let i = 0; i <= p.sides; i++) {
                const angle = i * step;
                const x = p.x + Math.cos(angle) * p.radius;
                const y = p.y + Math.sin(angle) * p.radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.strokeStyle = `hsl(${(p.angle * 180) % 360}, 100%, 60%)`;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    }
}
