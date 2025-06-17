export default class AudioVisualizer {
    // Private fields for internal state
    #canvas;
    #ctx;
    #analyser;
    #getAudioData;

    // Terrain properties
    #terrain = {
        rows: 100, // Number of lines along the z-axis
        cols: 40,  // Number of points per line
        width: 2000,
        height: 800,
        depth: 100,
        noiseOffset: 0,
        noiseTarget: 0,
        noiseSpeed: 0.0007,
        morphSpeed: 0.05,
    };

    // Camera and rendering properties
    #camera = {
        fov: 400,
        z: 0,
        speed: 0,
        maxSpeed: 1.5,
        acceleration: 0.05,
    };

    // Simple beat detection state
    #beat = {
        lastBassEnergy: 0,
        threshold: 0.85, // Adjust based on your getAudioData() output scale
        cooldown: 30, // Frames to wait before detecting another beat
        timer: 0,
    };

    /**
     * @constructor
     * @param {HTMLCanvasElement} canvas - The canvas element to render the visualization on.
     * @param {AnalyserNode} analyser - The Web Audio API AnalyserNode.
     * @param {Function} getAudioData - A function that returns { totalEnergy, bassEnergy, highEnergy }.
     */
    constructor(canvas, analyser, getAudioData) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#analyser = analyser; // Stored for potential future use
        this.#getAudioData = getAudioData;

        // Set initial canvas dimensions
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    }

    /**
     * Resizes the canvas to fit the window and resets projection center.
     */
    resize() {
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;
    }

    /**
     * A simple 1D value noise function for generating terrain.
     * @param {number} x - The input coordinate.
     * @returns {number} A noise value between -1 and 1.
     */
    #noise(x) {
        x = (x << 13) ^ x;
        return (1.0 - ((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
    }

    /**
     * Projects a 3D point to a 2D canvas coordinate.
     * @param {number} x - The x-coordinate in 3D space.
     * @param {number} y - The y-coordinate in 3D space.
     * @param {number} z - The z-coordinate in 3D space.
     * @returns {{x: number, y: number, scale: number}} The projected 2D point and its scale.
     */
    #project(x, y, z) {
        const relativeZ = z - this.#camera.z;
        const scale = this.#camera.fov / (this.#camera.fov + relativeZ);
        return {
            x: this.#canvas.width / 2 + x * scale,
            y: this.#canvas.height / 2 + y * scale,
            scale: scale,
        };
    }

    /**
     * Updates the state of the visualization for the next frame.
     * This includes camera movement, terrain morphing, and beat detection.
     */
    update() {
        const { totalEnergy, bassEnergy } = this.#getAudioData();

        // --- Camera Movement ---
        // Accelerate or decelerate camera based on total audio energy
        const targetSpeed = totalEnergy * this.#camera.maxSpeed;
        this.#camera.speed += (targetSpeed - this.#camera.speed) * this.#camera.acceleration;
        this.#camera.z += this.#camera.speed;

        // --- Beat Detection & Terrain Morphing ---
        if (this.#beat.timer > 0) {
            this.#beat.timer--;
        } else if (bassEnergy > this.#beat.threshold && bassEnergy > this.#beat.lastBassEnergy) {
            // On beat, set a new target for the noise function
            this.#terrain.noiseTarget += 1000; // Jump to a new terrain shape
            this.#beat.timer = this.#beat.cooldown;
        }
        this.#beat.lastBassEnergy = bassEnergy;

        // Smoothly interpolate the noise offset towards the target
        this.#terrain.noiseOffset += (this.#terrain.noiseTarget - this.#terrain.noiseOffset) * this.#terrain.morphSpeed;
    }

    /**
     * Renders the current state of the visualization to the canvas.
     */
    draw() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

        const camZ = Math.floor(this.#camera.z / this.#terrain.depth);

        for (let z = camZ; z < camZ + this.#terrain.rows; z++) {
            // Don't draw lines that are behind the camera
            if ((z * this.#terrain.depth) < this.#camera.z) continue;

            this.#ctx.beginPath();
            let firstPointProjected = null;

            for (let x = -this.#terrain.cols / 2; x <= this.#terrain.cols / 2; x++) {
                // Generate height (y) using noise
                const noiseInputX = x * 0.1;
                const noiseInputZ = z * 0.1 + this.#terrain.noiseOffset * this.#terrain.noiseSpeed;
                const height = this.#noise(noiseInputX + noiseInputZ) * this.#terrain.height;

                // Define 3D point
                const point3D = {
                    x: x * (this.#terrain.width / this.#terrain.cols),
                    y: height,
                    z: z * this.#terrain.depth,
                };

                const projected = this.#project(point3D.x, point3D.y, point3D.z);
                
                if (!firstPointProjected) {
                    firstPointProjected = projected;
                    this.#ctx.moveTo(projected.x, projected.y);
                } else {
                    this.#ctx.lineTo(projected.x, projected.y);
                }
            }

            // --- Shading and Styling ---
            const distance = (z * this.#terrain.depth) - this.#camera.z;
            const brightness = Math.max(0, 150 - (distance / 40)); // Closer lines are brighter
            const alpha = Math.max(0, 1 - (distance / 5000));      // Fade out in the distance

            this.#ctx.strokeStyle = `rgba(170, 100, 255, ${alpha})`; // Purple hue
            this.#ctx.lineWidth = Math.max(0.5, firstPointProjected.scale * 2);
            this.#ctx.stroke();
        }
    }
}