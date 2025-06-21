export default class AudioVisualizer {
    constructor(canvas, analyser, getAudioData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.analyser = analyser;
        this.getAudioData = getAudioData;

        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight;

        this.particles = [];
        this.particleCount = 1500;
        this.maxRadius = 80;
        this.minRadius = 20;

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                r: Math.random() * (this.maxRadius - this.minRadius) + this.minRadius,
                baseR: 0,
                opacity: Math.random() * 0.3 + 0.1,
            });
        }
    }

    update() {
        const audio = this.getAudioData();
        const bassBoost = Math.min(audio.bassEnergy / 255, 1);
        const energyFactor = Math.min(audio.totalEnergy / 255, 1);

        for (let p of this.particles) {
            p.x += p.vx + (Math.random() - 0.5) * 0.3 * energyFactor;
            p.y += p.vy + (Math.random() - 0.5) * 0.3 * energyFactor;

            if (p.x < -p.r) p.x = this.width + p.r;
            if (p.x > this.width + p.r) p.x = -p.r;
            if (p.y < -p.r) p.y = this.height + p.r;
            if (p.y > this.height + p.r) p.y = -p.r;

            const dynamicRadius = p.r * (1 + bassBoost * 0.5);
            p.baseR = dynamicRadius;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';

        for (let p of this.particles) {
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.baseR);
            gradient.addColorStop(0, `rgba(150, 150, 150, ${p.opacity})`);
            gradient.addColorStop(1, 'rgba(150, 150, 150, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.baseR, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }
}
