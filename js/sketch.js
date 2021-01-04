/*jshint esversion: 6 */

let chart, stats;
let inside_points, total_points;
let ctx, canvas;

class Sketch {
  constructor(canvas, ctx, fps) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.setFps(fps);

    this.width = canvas.width;
    this.height = canvas.height;

    this.frameCounter = 0;
  }

  setFps(fps) {
    // set fps
    this.fps = fps || 60;
    // keep track of time to handle fps
    this.then = performance.now();
    // time between frames
    this.fps_interval = 1 / this.fps;
  }

  run() {
    // bootstrap the sketch
    this.setup();
    // anti alias
    this.ctx.imageSmoothingQuality = "high";
    this.timeDraw();
  }

  timeDraw() {
    // request another frame
    window.requestAnimationFrame(this.timeDraw.bind(this));
    let diff;
    diff = performance.now() - this.then;
    if (diff < this.fps_interval) {
    // not enough time has passed, so we request next frame and give up on this render
      return;
    }
    // updated last frame rendered time
    this.then = performance.now();
    // now draw
    this.ctx.save();
    this.draw();
    this.ctx.restore();
    this.frameCounter++;
  }

  setHSLstroke(h, s, l) {
    // set stroke using h, s, l, values
    // h : 0 -> 360
    // s : 0 -> 100
    // l : 0 -> 100
    this.ctx.strokeStyle = `hsl(${h}, ${s}%, ${l}%)`;
  }

  setBWstroke(l, a) {
    // set stroke by level and alpha
    // l : 0 -> 255
    // a : 0 -> 1
    let level = l;
    let alpha = a || 1;
    this.ctx.strokeStyle = `rgba(${level}, ${level}, ${level}, ${alpha})`;
  }

  background(color) {
    // reset background
    // reset canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    // set background
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setup() {
    // this is ran once
    let seed = new Date().getTime();
    this.noise = new SimplexNoise(seed);
    this.noise_scl = 0.001;
    this.time_scl = 0.75;
    this.ended = false;
    this.resolution_step = 5;
    this.direction = 1;
    this.frameOffset = 0;

    // parameters
    this.primes = [50, 5, 3];
    this.scl = 0.8;
    this.duration = 25;
    this.linewidth = 2;
    this.colors = true;

    this.smooth_primes = [...this.primes];
    while (Math.min(...this.smooth_primes) < 100) {
      this.smooth_primes = this.smooth_primes.map(x => x * this.resolution_step);
    }

  }

  draw() {
    let start, end, progress;

    progress = this.frameCounter / (this.fps * this.duration) - this.frameOffset;

    if (progress >= 1) {
      this.direction = this.direction == 1 ? -1 : 1;
      progress = 0;
      this.frameOffset++;
    }

    if (this.direction == 1) {
      start = 0;
      end = parseInt(progress * lcm(this.smooth_primes));
    } else if (this.direction == -1) {
      end = lcm(this.smooth_primes);
      start = parseInt(progress * end);
    }


    let coords = []; // all coordinates

    let time_theta = 2 * Math.PI / (this.duration * this.fps) * this.frameCounter;
    let tx = this.time_scl * Math.cos(time_theta);
    let ty = this.time_scl * Math.sin(time_theta);
    this.ctx.save();
    this.background("black");
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.scl, this.scl);
    this.ctx.lineWidth = this.linewidth;
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";

    for (let i = start; i < end; i++) {
      let vx, vy;
      vx = 0;
      vy = 0;

      this.ctx.save();
      for (let p = 0; p < this.smooth_primes.length; p++) {
        let rho, theta;
        rho = this.width / Math.pow(2, p) / 4;
        theta = Math.PI * 2 / this.smooth_primes[p] * i;
        vx += rho * Math.cos(theta);
        vy += rho * Math.sin(theta);

        if ((i == end - 1 && this.direction == 1) || (i == start && this.direction == -1) ) {
          this.ctx.rotate(theta);

          this.ctx.beginPath();
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(rho, 0);
          this.ctx.stroke();

          this.ctx.beginPath();
          this.ctx.arc(0, 0, rho, 0, Math.PI * 2);
          this.ctx.stroke();

          this.ctx.translate(rho, 0);
          this.ctx.rotate(-theta);
        }
      }
      this.ctx.restore();
      coords.push([vx, vy]);
    }

    for (let i = 1; i < coords.length; i++) {
      // first line
      // y = a * x + c
      let x = coords[i % coords.length][0];
      let y = coords[i % coords.length][1];

      // second line
      // yy = b * xx + d
      let xx = coords[i-1][0];
      let yy = coords[i-1][1];

      // noise coordinates
      let nx = (x + xx) / 2 * this.noise_scl;
      let ny = (y + yy) / 2 * this.noise_scl;
      let n = this.noise.noise4D(nx, ny, tx, ty);


      if (this.colors) {
        let hue = (n + 1) / 2 * 360;
        this.setHSLstroke(hue, 100, 25);
      } else {
        let alpha = (n + 1) / 2;
        this.setBWstroke(255, alpha);
      }

      this.ctx.beginPath();
      this.ctx.moveTo(xx, yy); // start point
      this.ctx.lineTo(x, y); // end point
      this.ctx.stroke();
    }
    this.ctx.restore();

  }
}
