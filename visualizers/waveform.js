export default class AudioVisualizer {
  constructor(canvas, analyser, getAudioData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyser;
    this.getAudioData = getAudioData;
    this.width = canvas.width;
    this.height = canvas.height;
    this.waveform = new Uint8Array(this.analyser.fftSize);
  }

  update() {
    this.analyser.getByteTimeDomainData(this.waveform);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.beginPath();
    const sliceWidth = this.width / this.waveform.length;
    let x = 0;

    for (let i = 0; i < this.waveform.length; i++) {
      const v = this.waveform[i] / 255;
      const y = v * this.height;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }
}
