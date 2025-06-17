export default class AudioVisualizer {
    constructor(canvas, analyser, getAudioData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.analyser = analyser;
        this.getAudioData = getAudioData;
        this.particles = [];
        this.barCount = 128;
        this.rippleRadius = 0;
        this.rippleAlpha = 0;
        this.center = { x: canvas.width / 2, y: canvas.height / 2 };
        this.lastBeat = 0;
        this.fftData = new Uint8Array(analyser.frequencyBinCount);
        this._initParticles();
    }

    _initParticles() {
        for (let i = 0; i < this.barCount; i++) {
            this.particles.push({ angle: (i / this.barCount) * Math.PI * 2, value: 0 });
        }
    }

    update() {
        this.analyser.getByteFrequencyData(this.fftData);
        const { bassEnergy } = this.getAudioData();

        for (let i = 0; i < this.barCount; i++) {
            const fftIndex = Math.floor(i * this.fftData.length / this.barCount);
            const v = this.fftData[fftIndex] / 255;
            this.particles[i].value = v;
        }

        if (bassEnergy > 0.9 && performance.now() - this.lastBeat > 300) {
            this.rippleRadius = 0;
            this.rippleAlpha = 1;
            this.lastBeat = performance.now();
        }

        if (this.rippleAlpha > 0) {
            this.rippleRadius += 20;
            this.rippleAlpha -= 0.02;
            if (this.rippleAlpha < 0) this.rippleAlpha = 0;
        }
    }

    draw() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        const radius = Math.min(width, height) * 0.25;

        for (let i = 0; i < this.particles.length; i++) {
            const { angle, value } = this.particles[i];
            const barLength = value * 100 + 20;
            const x1 = this.center.x + Math.cos(angle) * radius;
            const y1 = this.center.y + Math.sin(angle) * radius;
            const x2 = this.center.x + Math.cos(angle) * (radius + barLength);
            const y2 = this.center.y + Math.sin(angle) * (radius + barLength);

            this.ctx.strokeStyle = `hsl(${angle * 180 / Math.PI}, 100%, 60%)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }

        if (this.rippleAlpha > 0) {
            this.ctx.beginPath();
            this.ctx.arc(this.center.x, this.center.y, this.rippleRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.rippleAlpha})`;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }
    }
}
