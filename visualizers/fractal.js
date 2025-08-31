export default class FractalStormVisualizer {
	constructor(canvas, analyser) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.analyser = analyser;

		this.analyser.fftSize = 256;
		this.bufferLength = this.analyser.frequencyBinCount;
		this.dataArray = new Uint8Array(this.bufferLength);

		this.zoom = 1;
		this.angle = 0;
		this.lightningBolts = [];
	}

	getAudioFrame() {
		this.analyser.getByteFrequencyData(this.dataArray);
		const bass = this.dataArray.slice(2, 20).reduce((a, b) => a + b, 0) / 18;
		const high = this.dataArray.slice(this.bufferLength - 20).reduce((a, b) => a + b, 0) / 20;
		const total = this.dataArray.reduce((a, b) => a + b, 0) / this.bufferLength;
		return { bass, high, total };
	}

	update() {
		const { bass, high, total } = this.getAudioFrame();

		this.zoom += bass * 0.0005;
		this.angle += 0.002 + high * 0.00005;

		if (bass > 160) {
			this.lightningBolts.push({
				x: Math.random() * this.canvas.width,
				y: Math.random() * this.canvas.height,
				opacity: 1
			});
		}

		this.lightningBolts.forEach(b => b.opacity -= 0.05);
		this.lightningBolts = this.lightningBolts.filter(b => b.opacity > 0);

		this.pulse = Math.sin(total * 0.05) * 0.2 + 0.8;
	}

	draw() {
		this.ctx.fillStyle = "rgba(0,0,0,0.2)";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.save();
		this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
		this.ctx.scale(this.zoom, this.zoom);
		this.ctx.rotate(this.angle);

		this.drawFractal(0, 0, this.canvas.height / 6 * this.pulse, 8);

		this.ctx.restore();

		this.lightningBolts.forEach(b => {
			this.drawLightning(b.x, b.y, b.opacity);
		});
	}

	drawFractal(x, y, size, depth) {
		if (depth === 0) return;
		this.ctx.strokeStyle = `rgba(100,200,255,${0.2 + depth * 0.1})`;
		this.ctx.lineWidth = depth * 0.4;
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		for (let i = 0; i < 3; i++) {
			const angle = i * (Math.PI * 2 / 3);
			const nx = x + Math.cos(angle) * size;
			const ny = y + Math.sin(angle) * size;
			this.ctx.lineTo(nx, ny);
			this.drawFractal(nx, ny, size * 0.6, depth - 1);
		}
		this.ctx.stroke();
	}

	drawLightning(x, y, opacity) {
		this.ctx.strokeStyle = `rgba(180,220,255,${opacity})`;
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.moveTo(x, y);
		for (let i = 0; i < 10; i++) {
			x += (Math.random() - 0.5) * 30;
			y += Math.random() * 30;
			this.ctx.lineTo(x, y);
		}
		this.ctx.stroke();
	}
}
