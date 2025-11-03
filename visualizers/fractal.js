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
        
        // Ribbon settings
        this.maxConnectionDistance = 150; 

		this.initParticles(this.baseNumParticles);
	}

	getAudioFrame() {
		if (!this.bufferLength) {
			this.analyser.fftSize = 256;
			this.bufferLength = this.analyser.frequencyBinCount;
			this.dataArray = new Uint8Array(this.bufferLength);
		}
        
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
			// Pass the groove state to the particle for potential color/behavior change
			p.update(totalEnergy / 255, bassEnergy, highEnergy, beatDetected, this.particlesOnGroove);
		});

		this.removeOldParticles();
		this.maintainBaseParticles();
	}

	draw() {
		// **1. Semi-transparent overlay for trails (The Ribbon Effect)**
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		// **2. Draw connections (the Ribbon)**
		this.drawConnections();

		// **3. Draw the particles (the anchors)**
		this.particlesArray.forEach(p => p.draw(this.ctx));
	}
    
    // **New Method: Drawing the connection lines (The Ribbon)**
    drawConnections() {
        const grooveActive = this.particlesOnGroove; 

        for (let i = 0; i < this.particlesArray.length; i++) {
            for (let j = i + 1; j < this.particlesArray.length; j++) {
                const p1 = this.particlesArray[i];
                const p2 = this.particlesArray[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.maxConnectionDistance) {
                    // Opacity fades with distance
                    const opacity = (1 - (distance / this.maxConnectionDistance)) * 0.5; 
                    
                    // Color shift based on groove state
                    this.ctx.strokeStyle = grooveActive 
                        ? `rgba(255, 100, 50, ${opacity})` // Vibrant Orange on groove
                        : `rgba(100, 100, 255, ${opacity})`; // Subtle Blue default

                    // Line thickness increases with proximity and particle size
                    this.ctx.lineWidth = 1 + (p1.size + p2.size) / 10; 

                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
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

	update(volume, bassEnergy, highEnergy, beatDetected, grooveActive) {
		let dampingFactor = 0.99;

		// **Momentum Surge:** Decrease damping (friction) on a beat
		if (beatDetected) {
			dampingFactor = 0.995; // Less friction, allowing particles to coast/trail longer
            
			// Add a gentle outward push scaled by bass
			this.velocityX += (Math.random() - 0.5) * (bassEnergy / 255) * 2;
			this.velocityY += (Math.random() - 0.5) * (bassEnergy / 255) * 2;
		}
        
		this.velocityX *= dampingFactor;
		this.velocityY *= dampingFactor;

        // Gravity/upward drift controlled by high energy
		this.velocityY += highEnergy * 0.005; 

		this.x += this.velocityX;
		this.y += this.velocityY;

		// Screen wrapping
		if (this.x > this.canvas.width) this.x = 0;
		if (this.x < 0) this.x = this.canvas.width;
		if (this.y > this.canvas.height) this.y = 0;
		if (this.y < 0) this.y = this.canvas.height;

		// **High-Energy Shimmer:** Size pulsates with overall volume and high frequency
		this.size = this.baseSize + volume * 50 + highEnergy * 0.1; 

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
        // Base color (e.g., magenta)
        const baseHue = 300; 
        
        // Fill style uses HSL for vibrant color
		ctx.fillStyle = `hsla(${baseHue}, 80%, 60%, ${this.opacity})`;
		
        // **Shimmer/Glow Effect**
        ctx.shadowBlur = 10; 
        ctx.shadowColor = `hsla(${baseHue}, 80%, 60%, ${this.opacity})`;

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();
        
        // Reset shadow for subsequent drawing (like the connections)
        ctx.shadowBlur = 0;
	}
}