export default class GrooveParticleVisualizer {
	constructor(canvas, analyser, getAudioData) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.analyser = analyser;
		this.getAudioData = getAudioData;

		this.baseNumParticles = 50;
		this.maxParticles = 200;
		this.particlesArray = [];

		this.beatThreshold = 1.05;
		this.energyHistory = new Array(60).fill(0);
		this.grooveDuration = 30;
		this.grooveCount = 0;
		this.particlesOnGroove = false;
		this.grooveDecay = 15;

		this.initParticles(this.baseNumParticles);
	}

	getAudioFrame() {
		this.analyser.getByteFrequencyData(this.dataArray);

		const bassStart = 2;
		const bassEnd = 20;
		let bassEnergy = this.dataArray.slice(bassStart, bassEnd).reduce((sum, v) => sum + v, 0) / (bassEnd - bassStart);

		const highStart = this.bufferLength - 20;
		const highEnd = this.bufferLength;
		let highEnergy = this.dataArray.slice(highStart, highEnd).reduce((sum, v) => sum + v, 0) / (highEnd - highStart);

		let totalEnergy = this.dataArray.reduce((sum, value) => sum + value, 0) / this.bufferLength;

		let avgEnergy = this.energyHistory.reduce((sum, e) => sum + e, 0) / this.energyHistory.length;
		let beatDetected = bassEnergy > avgEnergy * this.beatThreshold;

		this.energyHistory.shift();
		this.energyHistory.push(bassEnergy);

		return { totalEnergy, beatDetected, bassEnergy, highEnergy };
	}

	update() {
		if (!this.bufferLength) {
			this.analyser.fftSize = 256;
			this.bufferLength = this.analyser.frequencyBinCount;
			this.dataArray = new Uint8Array(this.bufferLength);
		}

		const { totalEnergy, beatDetected, bassEnergy, highEnergy } = this.getAudioFrame();

		if (beatDetected) {
			this.grooveCount++;
		} else {
			this.grooveCount = Math.max(0, this.grooveCount - 1);
		}

		if (this.grooveCount < this.grooveDuration - this.grooveDecay && this.particlesOnGroove) {
			this.particlesOnGroove = false;
			this.removeOldParticles();
		}

		if (this.grooveCount >= this.grooveDuration && !this.particlesOnGroove) {
			this.particlesOnGroove = true;
			let newParticles = Math.floor(bassEnergy / 10);
			this.initParticles(newParticles);
			this.grooveCount = 0;
		}

		this.particlesArray.forEach(p => {
			p.update(totalEnergy / 255, bassEnergy, highEnergy, beatDetected);
		});

		this.removeOldParticles();
		this.maintainBaseParticles();
	}

	draw() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.particlesArray.forEach(p => p.draw(this.ctx));
	}

	initParticles(num) {
		for (let i = 0; i < num; i++) {
			if (this.particlesArray.length < this.maxParticles) {
				this.particlesArray.push(new Particle(this.canvas));
			}
		}
	}

	removeOldParticles() {
		this.particlesArray = this.particlesArray.filter(p => p.opacity > 0);
	}

	maintainBaseParticles() {
		if (this.particlesArray.length < this.baseNumParticles) {
			let needed = this.baseNumParticles - this.particlesArray.length;
			this.initParticles(needed);
		}
	}
}

class Particle {
	constructor(canvas) {
		this.canvas = canvas;
		this.reset();
	}

	reset() {
		this.x = Math.random() * this.canvas.width;
		this.y = Math.random() * this.canvas.height;
		this.size = Math.random() * 2 + 5;
		this.mass = this.size;
		this.velocityX = (Math.random() - 0.5) * 0.5;
		this.velocityY = (Math.random() - 0.5) * 0.5;
		this.baseSize = 1;
		this.lifespan = Math.random() * 100 + 50;
		this.opacity = 0;
		this.maxOpacity = Math.random() * 0.5 + 0.5;
		this.fadeIn = true;
	}

	update(volume, bassEnergy, highEnergy, beatDetected) {
		this.velocityX *= 0.99;
		this.velocityY *= 0.99;

		if (beatDetected) {
			this.velocityX += (Math.random() - 0.5) * bassEnergy * 0.01;
			this.velocityY += (Math.random() - 0.5) * bassEnergy * 0.01;
		}

		this.velocityY += highEnergy * 0.005;

		this.x += this.velocityX;
		this.y += this.velocityY;

		if (this.x > this.canvas.width) this.x = 0;
		if (this.x < 0) this.x = this.canvas.width;
		if (this.y > this.canvas.height) this.y = 0;
		if (this.y < 0) this.y = this.canvas.height;

		this.size = this.baseSize + volume * 50;

		if (this.fadeIn) {
			this.opacity += 0.02;
			if (this.opacity >= this.maxOpacity) {
				this.fadeIn = false;
			}
		} else {
			this.lifespan -= 1;
			if (this.lifespan <= 0) {
				this.opacity -= 0.02;
			}
		}

		if (this.opacity <= 0) {
			this.reset();
		}
	}

	draw(ctx) {
		ctx.fillStyle = `rgba(30, 30, 30, ${this.opacity})`;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();
	}
}