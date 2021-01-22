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
    this.recording = false;

    this.frameCounter = 0;
  }

  resize() {
    this.width = canvas.width;
    this.height = canvas.height;

    let result = this.calculateRho(this._circles, this._relative_rho);
    if (result) {
      this.rho = result.rho;
      this.displacement = result.displacement;
    }
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
    this.frameOffset = this.frameCounter;
    this.ended = false;
    this._stopped = false;
    this.direction = 1;
    this._hue = parseInt(random() * 360);

    // parameters
    this._circles = [1];
    this._relative_rho = [1];
    this._duration = 15;
    this._line_width = 3;
    this.scl = 0.8;
    this._inside = false;
    this._colors = false;
    this._moving_colors = false;
    this._hue = parseInt(random() * 360);
    this._draw_circles = true;
    this.coords = [];
    // reset parameters
    this.calculateScl(this._duration);
    this.reset();
    this._smooth_circles = this.smoothNumbers(this._circles);

    let result = this.calculateRho(this._circles, this._relative_rho);
    if (result) {
      this.rho = result.rho;
      this.displacement = result.displacement;
    }
  }

  draw() {
    //console.log({stopped: this._stopped, smooth: this._smooth_circles, rho: this.rho, displacement: this.displacement});

    if (this._stopped) return;
    if (!this._smooth_circles) return;
    if (!this.rho || !this.displacement) return;

    let start, end, progress;
    progress = (this.frameCounter - this.frameOffset - 2) / (this.fps * this._duration);

    if (progress >= 1) {
      this.frameOffset = this.frameCounter;
      this.direction *= -1;
      if (this.direction === 1) {
        this.coords = [];

        if (this.recording) {
          this.saveCapture();
          $(".form .update").text("Video is now being generated. It might take a while! Reload the page afterwards.");
          this.recording = false;
        }
      }
    }

    this.ctx.save();
    this.background("black");
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.scl, this.scl);

    let vx, vy;
    vx = 0;
    vy = 0;
    if (this.direction === 1) {
      for (let p = 0; p < this._smooth_circles.length; p++) {
        let theta;
        theta = - Math.PI * 2 * progress * this._circles[p];

        if  (p < this._smooth_circles.length - 1) {
          vx += this.displacement[p] * Math.cos(theta);
          vy += this.displacement[p] * Math.sin(theta);
        } else {
          vx += this.rho[p] * Math.cos(theta);
          vy += this.rho[p] * Math.sin(theta);
        }
      }

      this.coords.push([Math.floor(vx), Math.floor(vy)]);
    } else {
      this.coords.shift();
    }

    if (this._draw_circles) {
      this.ctx.save();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      for (let p = 0; p < this._smooth_circles.length; p++) {
        let theta;
        theta = - Math.PI * 2 * progress * this._circles[p];

        this.ctx.rotate(theta);

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.displacement[p], 0);
        this.ctx.stroke();
        this.ctx.restore();

        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.rho[p], 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.translate(this.displacement[p], 0);
        this.ctx.rotate(-theta);
      }
      this.ctx.restore();
    }

    let time_theta = 2 * Math.PI / (this._duration * this.fps) * (this.frameCounter - this.frameOffset);
    let tx = this.time_scl * Math.cos(time_theta);
    let ty = this.time_scl * Math.sin(time_theta);

    this.ctx.save();
    this.ctx.lineWidth = this._line_width;
    for (let i = 1; i < this.coords.length; i++) {
      // first line
      // y = a * x + c
      let x = this.coords[i % this.coords.length][0];
      let y = this.coords[i % this.coords.length][1];

      // second line
      // yy = b * xx + d
      let xx = this.coords[i-1][0];
      let yy = this.coords[i-1][1];

      let nx, ny, n, hue;
      if (this._moving_colors) {
        // noise coordinates
        nx = (x + xx) / 2 * this.noise_scl;
        ny = (y + yy) / 2 * this.noise_scl;
        n = this.noise.noise4D(nx, ny, tx, ty);
        hue = Math.floor(((n + 1) / 2 * 360) % 360);
      } else {
        hue = this._hue;
      }

      if (this._colors) {
        this.setHSLstroke(hue, 100, 25);
      } else {
        this.setBWstroke(255);
      }

      this.ctx.beginPath();
      this.ctx.moveTo(xx, yy); // start point
      this.ctx.lineTo(x, y); // end point
      this.ctx.stroke();
    }

    this.ctx.restore();

    this.ctx.restore();

    if (this.recording) {
      capturer.capture(this.canvas);
    }

  }

  calculateScl(duration) {
    this.noise_scl = 0.002;
    this.time_scl = 0.5 * duration / 15;
  }

  smoothNumbers(numbers, factor) {
    let min_points = this.duration * this.fps * (factor || 16);
    let resolution_step = 4;

    let smoothed_numbers = [...numbers];
    if (smoothed_numbers.length >= 2) {
      while (lcm(smoothed_numbers) < min_points) {
        smoothed_numbers = smoothed_numbers.map(x => x * resolution_step);
      }
    } else if (smoothed_numbers.length === 1) {
      smoothed_numbers = [min_points];
    } else if (smoothed_numbers.length === 0) {
      return;
    }

    return smoothed_numbers;
  }

  calculateRho(numbers, relative_radiuses, inside) {
    if (numbers.length === 0) return;

    if (relative_radiuses === [] || relative_radiuses === undefined || relative_radiuses.length != numbers.length) {
      relative_radiuses = new Array(numbers.length).fill(1);
    }

    let relative_sum;
    if (inside) {
      relative_sum = Math.max(...relative_radiuses);
    } else {
      relative_sum = relative_radiuses.reduce((total, value) => total += value);
    }

    let rho;
    rho = numbers.map((r, i) => this.width / 4 / relative_sum * relative_radiuses[i]);

    let displacement = [];
    for (let i = 0; i < rho.length; i++) {
      if (inside) {
        if (i < rho.length - 1) {
          displacement.push(rho[i] - rho[i+1]);
        } else {
          displacement.push(rho[i]);
        }
      } else {
        if (i < rho.length - 1) {
          displacement.push(rho[i] + rho[i+1]);
        } else {
          displacement.push(rho[i]);
        }
      }
    }

    return {
      rho: rho,
      displacement: displacement
    };
  }

  setRevolutions(index, value) {
    this._circles[index] = value;
    this.reset();
  }

  setRelativeRadius(index, value) {
    this._relative_rho[index] = value;
    this.reset();
  }

  reset() {
    this.frameOffset = this.frameCounter;
    this.ended = false;
    this._stopped = false;
    this.direction = 1;
    this.coords = [];

    this._smooth_circles = this.smoothNumbers(this._circles);
    let result = this.calculateRho(this._circles, this._relative_rho, this._inside);
    if (result) {
      this.rho = result.rho;
      this.displacement = result.displacement;
    }

    this.background("black");

    if (this.recording) this.stopRecording();
  }

  stop() {
    this._stopped = true;
    this.pause_started = this.frameCounter;
  }

  play() {
    this._stopped = false;
    this.frameOffset += this.frameCounter - this.pause_started;
  }

  startRecordind() {
    this.recording = true;
    capturer.start();
    console.log("%c Started recording", "color:yellow;font-size:1rem;");
  }

  stopRecording() {
    this.recording = false;
    capturer.stop();
    this.reset();
  }

  saveCapture() {
    console.log("%c Recording ended. Saving.", "color:green;font-size:1rem;");
    return new Promise(resolve => {
      capturer.stop();
      capturer.save();
      this.reset();
    });
  }

  addCircle(revolutions, relative_rho) {
    this._circles.push(revolutions || 1);
    this._relative_rho.push(relative_rho || 1);

    this.reset();
  }

  removeCircle() {
    this._circles.pop();
    this._relative_rho.pop();

    this.reset();
  }

  get stopped() {
    return this._stopped;
  }

  get duration() {
    return this._duration;
  }

  set duration(d) {
    this.reset();

    this._duration = d;
    this._smooth_circles = this.smoothNumbers(this._circles);
    this.calculateScl(this._duration);

    let result = this.calculateRho(this._circles, this._relative_rho);
    if (result) {
      this.rho = result.rho;
      this.displacement = result.displacement;
    }

  }

  get line_width() {
    return this._line_width;
  }

  set line_width(w) {
    this._line_width = w;
    this.reset();
  }

  get inside() {
    return this._inside;
  }

  set inside(i) {
    this._inside = i;
    this.reset();
  }

  get colors() {
    return this._colors;
  }

  set colors(c) {
    this._colors = c;
  }

  get moving_colors() {
    return this._moving_colors;
  }

  set moving_colors(m) {
    this._moving_colors = m;
  }

  get hue() {
    return this._hue;
  }

  set hue(h) {
    this._hue = h;
  }

  get draw_circles() {
    return this._draw_circles;
  }

  set draw_circles(d) {
    this._draw_circles = d;
  }

  get circles() {
    if (this._circles === undefined) return [];
    return this._circles;
  }

  get relative_rho() {
    if (this._relative_rho === undefined) return [];
    return this._relative_rho;
  }
}
