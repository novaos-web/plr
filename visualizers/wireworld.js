export default class AudioTerrainVisualizer {
    constructor(canvas, analyser, getAudioData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.getAudioData = getAudioData;

        this.width = canvas.width;
        this.height = canvas.height;

        this.cols = 100;
        this.rows = 150;
        this.gridSpacing = 20;
        this.speed = 4;

        this.cameraZ = 0;
        this.fov = 300;
        this.noiseOffset = 0;
        this.lastBeat = 0;

        this.grid = [];

        for (let z = 0; z < this.rows; z++) {
            let row = [];
            for (let x = 0; x < this.cols; x++) {
                row.push(0);
            }
            this.grid.push(row);
        }
    }

    _noise(x, z) {
        return Math.sin(x * 0.2 + z * 0.3 + this.noiseOffset) * 30;
    }

    _project(x, y, z) {
        const scale = this.fov / (this.fov + z - this.cameraZ);
        return {
            x: x * scale + this.width / 2,
            y: y * scale + this.height / 2
        };
    }

    update() {
        const { bassEnergy, highEnergy, totalEnergy } = this.getAudioData();

        this.cameraZ += this.speed;
        this.noiseOffset += 0.02 + totalEnergy * 0.0002;

        const now = performance.now();
        const beat = bassEnergy > 200 && now - this.lastBeat > 300;
        if (beat) this.lastBeat = now;

        this.grid.pop();

        const newRow = [];
        for (let x = 0; x < this.cols; x++) {
            const nx = (x - this.cols / 2) * this.gridSpacing;
            const z = this.cameraZ + 0;
            let h = this._noise(nx * 0.05, z * 0.01);

            if (beat) h += Math.random() * bassEnergy * 0.3;

            h += Math.sin(x * 0.1 + this.noiseOffset * 2) * highEnergy * 0.05;
            newRow.push(h);
        }

        this.grid.unshift(newRow);
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;

        for (let z = 0; z < this.rows - 1; z++) {
            for (let x = 0; x < this.cols - 1; x++) {
                const x0 = (x - this.cols / 2) * this.gridSpacing;
                const x1 = (x + 1 - this.cols / 2) * this.gridSpacing;
                const z0 = z * this.gridSpacing;
                const z1 = (z + 1) * this.gridSpacing;

                const y00 = this.grid[z][x];
                const y01 = this.grid[z][x + 1];
                const y10 = this.grid[z + 1][x];
                const y11 = this.grid[z + 1][x + 1];

                const p0 = this._project(x0, y00, z0);
                const p1 = this._project(x1, y01, z0);
                const p2 = this._project(x1, y11, z1);
                const p3 = this._project(x0, y10, z1);

                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.stroke();
            }
        }
    }
}
