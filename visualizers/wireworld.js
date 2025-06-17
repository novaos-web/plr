export default class AudioVisualizer {
    constructor(canvas, analyser, getAudioData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.analyser = analyser;
        this.getAudioData = getAudioData;

        this.width = canvas.width;
        this.height = canvas.height;

        this.rows = 100;
        this.cols = 200;
        this.spacing = 5;
        this.terrain = new Array(this.rows).fill(0).map(() => new Array(this.cols).fill(0));
        this.nextTerrain = this._generateTerrain();

        this.zOffset = 0;
        this.speed = 1;
        this.maxSpeed = 10;
        this.lerpAmount = 0;

        this.lastBassEnergy = 0;
    }

    update() {
        const { bassEnergy, totalEnergy } = this.getAudioData();

        if (bassEnergy - this.lastBassEnergy > 0.3) {
            this.nextTerrain = this._generateTerrain();
            this.lerpAmount = 0;
        }
        this.lastBassEnergy = bassEnergy;

        this.lerpAmount = Math.min(this.lerpAmount + 0.02, 1);

        for (let z = 0; z < this.rows; z++) {
            for (let x = 0; x < this.cols; x++) {
                const current = this.terrain[z][x];
                const target = this.nextTerrain[z][x];
                this.terrain[z][x] = current + (target - current) * this.lerpAmount;
            }
        }

        this.speed = 1 + totalEnergy * this.maxSpeed;
        this.zOffset += this.speed;
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#0ff';

        ctx.save();
        ctx.translate(this.width / 2, this.height / 2 + 100);
        ctx.scale(1, -1);

        for (let z = 0; z < this.rows - 1; z++) {
            ctx.beginPath();
            for (let x = 0; x < this.cols; x++) {
                const worldX = (x - this.cols / 2) * this.spacing;
                const worldZ1 = (z - this.zOffset % 1) * this.spacing;
                const worldZ2 = (z + 1 - this.zOffset % 1) * this.spacing;

                const y1 = this.terrain[z][x];
                const y2 = this.terrain[z + 1][x];

                const screen1 = this._project(worldX, y1, worldZ1);
                const screen2 = this._project(worldX, y2, worldZ2);

                if (x === 0) ctx.moveTo(screen2.x, screen2.y);
                ctx.lineTo(screen2.x, screen2.y);
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    _generateTerrain() {
        const terrain = [];
        const scale = 0.05 + Math.random() * 0.1;
        const heightScale = 60 + Math.random() * 40;
        for (let z = 0; z < this.rows; z++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) {
                const nx = x * scale;
                const nz = z * scale;
                const h = this._noise(nx, nz) * heightScale;
                row.push(h);
            }
            terrain.push(row);
        }
        return terrain;
    }

    _project(x, y, z) {
        const fov = 300;
        const scale = fov / (fov + z);
        return {
            x: x * scale,
            y: y * scale
        };
    }

    _noise(x, y) {
        return (Math.sin(x * 1.5 + y * 1.3) + Math.sin(y * 0.7 + x * 0.9)) * 0.5 + 0.5;
    }
}
