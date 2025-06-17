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
        this.beatThreshold = 0.7;
        this.beatCooldown = 200;
    }

    update() {
        const now = performance.now();
        const { bassEnergy } = this.getAudioData();

        if (bassEnergy > this.beatThreshold && now - this.lastBeat > this.beatCooldown) {
            this.lastBeat = now;
            const sides = Math.max(3, Math.floor(8 - bassEnergy * 6));
            const count = 5 + Math.floor(bassEnergy * 25);
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: this.width / 2,
                    y: this.height / 2,
                    radius: 10 + Math.random() * 20,
                    sides,
                    angle: Math.random() * Math.PI * 2,
                    speed: 1 + Math.random() * 3,
                    rotation: Math.random() * 0.1,
                    alpha: 1,
                    decay: 0.01 + Math.random() * 0.02
                });
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
            p.alpha -= p.decay;
            p.angle += p.rotation;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2);
        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.translate(p.x - this.width / 2, p.y - this.height / 2);
            this.ctx.rotate(p.angle);
            this.ctx.beginPath();
            for (let i = 0; i <= p.sides; i++) {
                const angle = (i / p.sides) * 2 * Math.PI;
                const x = Math.cos(angle) * p.radius;
                const y = Math.sin(angle) * p.radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.strokeStyle = `hsl(${p.angle * 50 % 360}, 100%, 70%)`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.restore();
        }
        this.ctx.restore();
    }
}
