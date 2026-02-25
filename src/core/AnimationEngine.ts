export type AnimationCallback = (timeIndex: number, isPlaying: boolean) => void;

export class AnimationEngine {
  private isPlaying = false;
  private timeIndex = 0;
  private totalFrames = 0;
  private speed = 1;
  private durationPerFrame = 500;
  private isLooping = false;
  private lastTime = 0;
  private animationFrameId = 0;
  private subscribers: Set<AnimationCallback> = new Set();

  constructor() {}

  public subscribe(callback: AnimationCallback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach(cb => cb(this.timeIndex, this.isPlaying));
  }

  public setConfig(totalFrames: number, durationPerFrame: number) {
    this.totalFrames = totalFrames;
    this.durationPerFrame = durationPerFrame;
  }

  public setSpeed(speed: number) {
    this.speed = speed;
  }

  public setLooping(isLooping: boolean) {
    this.isLooping = isLooping;
  }

  public setTimeIndex(index: number) {
    this.timeIndex = Math.max(0, Math.min(this.totalFrames - 1, index));
    this.notify();
  }

  public getTimeIndex() {
    return this.timeIndex;
  }

  public play() {
    if (this.isPlaying || this.totalFrames <= 1) return;
    if (this.timeIndex >= this.totalFrames - 1) {
      this.timeIndex = 0;
    }
    this.isPlaying = true;
    this.lastTime = performance.now();
    this.notify();
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationFrameId);
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  private loop = (time: number) => {
    if (!this.isPlaying) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    const progressToAdd = (deltaTime * this.speed) / this.durationPerFrame;
    this.timeIndex += progressToAdd;

    let shouldStop = false;
    if (this.timeIndex >= this.totalFrames - 1) {
      if (this.isLooping) {
        this.timeIndex = 0;
      } else {
        this.timeIndex = this.totalFrames - 1;
        shouldStop = true;
      }
    }

    this.notify();

    if (shouldStop) {
      this.isPlaying = false;
      this.notify();
    } else {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };
}
