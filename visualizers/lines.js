export default class AudioVisualizer {
  constructor(canvas, analyser, getAudioData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyser;
    this.getAudioData = getAudioData;
    this.width = canvas.width;
    this.height = canvas.height;
    this.barCount = 128;
    this.barWidth = this.width / this.barCount;
    this.freqData = new Uint8Array(analyser.frequencyBinCount);
    this.lastBassEnergy = 0;
    this.beatDetected = false;
  }

  update() {
    this.analyser.getByteFrequencyData(this.freqData);
    const audioData = this.getAudioData();
    this.beatDetected = audioData.bassEnergy - this.lastBassEnergy > 15;
    this.lastBassEnergy = audioData.bassEnergy;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const step = Math.floor(this.freqData.length / this.barCount);
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#00f');
    gradient.addColorStop(0.5, '#0ff');
    gradient.addColorStop(1, '#fff');
    this.ctx.fillStyle = gradient;

    for (let i = 0; i < this.barCount; i++) {
      const magnitude = this.freqData[i * step];
      const barHeight = (magnitude / 255) * this.height;
      const x = i * this.barWidth;
      const heightBoost = this.beatDetected ? 1.2 : 1.0;
      this.ctx.fillRect(x, this.height - barHeight * heightBoost, this.barWidth * 0.9, barHeight * heightBoost);
    }
  }
}
