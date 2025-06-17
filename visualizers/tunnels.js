export default class AudioTunnelVisualizer {
    constructor(canvas, analyser, getAudioData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.analyser = analyser;
        this.getAudioData = getAudioData;

        this.width = canvas.width;
        this.height = canvas.height;

        this.tunnelSegments = [];
        this.segmentCount = 100;
        this.segmentSpacing = 20;
        this.segmentDepth = 2000;
        this.speed = 8;

        this.textureIndex = 0;
        this.lastBeatTime = 0;

        this.cameraZ = 0;
        this.noiseSeed = Math.random() * 1000;

        for (let i = 0; i < this.segmentCount; i++) {
            this.tunnelSegments.push(this._createSegment(i));
        }
    }

    _createSegment(index) {
        const radius = this.width / 3;
        const sides = 32;
        const points = [];

        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * 2 * Math.PI;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push({ x, y });
        }

        return {
            z: index * this.segmentSpacing,
            points,
            textureSeed: Math.random() * 10000
        };
    }

    _project(x, y, z) {
        const fov = 300;
        const scale = fov / (fov + z - this.cameraZ);
        return {
            x: x * scale + this.width / 2,
            y: y * scale + this.height / 2
        };
    }

    update() {
        const { bassEnergy, totalEnergy } = this.getAudioData();

        this.cameraZ += this.speed;

        const now = performance.now();
        if (bassEnergy > 200 && now - this.lastBeatTime > 300) {
            this.textureIndex = (this.textureIndex + 1) % 4;
            this.lastBeatTime = now;
        }

        for (let segment of this.tunnelSegments) {
            if (segment.z - this.cameraZ < -this.segmentSpacing) {
                segment.z += this.segmentCount * this.segmentSpacing;
                segment.textureSeed = Math.random() * 10000;
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.width, this.height);

        for (let i = this.tunnelSegments.length - 1; i > 0; i--) {
            const segA = this.tunnelSegments[i];
            const segB = this.tunnelSegments[i - 1];

            for (let j = 0; j < segA.points.length; j++) {
                const next = (j + 1) % segA.points.length;

                const p1 = this._project(segA.points[j].x, segA.points[j].y, segA.z);
                const p2 = this._project(segA.points[next].x, segA.points[next].y, segA.z);
                const p3 = this._project(segB.points[next].x, segB.points[next].y, segB.z);
                const p4 = this._project(segB.points[j].x, segB.points[j].y, segB.z);

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.lineTo(p4.x, p4.y);
                ctx.closePath();

                const t = (Math.sin(segA.textureSeed + j * 0.3 + this.textureIndex) + 1) / 2;
                const shade = Math.floor(t * 255);
                ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
                ctx.fill();
            }
        }
    }
}
