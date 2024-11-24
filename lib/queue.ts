import { NoBotsAvailable } from "../errors";
import type { BotController } from "./bot_controller";
import type { Job } from "./job";

import { EventEmitter } from "events";

export class Queue extends EventEmitter {
  queue: Job[] = [];
  users: Record<string, number> = {};
  concurrency = 0;
  running = false;
  handler!: (job: Job) => Promise<number>;
  processing:number = 0;
  constructor() {
    super();
  }

  size() {
    return this.queue.length;
  }

  process(concurrency: number, controller: BotController, handler: (job: Job) => Promise<number>) {
    this.handler = handler;
    this.concurrency = concurrency;
    this.processing = 0;

    this.start();

    // Monkey patch to ensure queue processing size is roughly equal to amount of bots ready
    setInterval(() => {
      // Update concurrency level, possible bots went offline or otherwise
      const oldConcurrency = this.concurrency;
      this.concurrency = controller.getReadyAmount();

      if (this.concurrency > oldConcurrency) {
        for (let i = 0; i < this.concurrency - oldConcurrency; i++) {
          this.checkQueue();
        }
      }
    }, 50);
  }

  addJob(job: Job, max_attempts: number) {
    if (!((job.ip as string) in this.users)) {
      this.users[job.ip as string] = 0;
    }

    for (const link of job.getRemainingLinks()) {
      this.queue.push({
        data: link,
        max_attempts: max_attempts,
        attempts: 0,
        ip: job.ip,
      });

      this.users[job.ip as string]++;
      this.checkQueue();
    }
  }

  checkQueue() {
    if (!this.running) return;

    if (this.queue.length > 0 && this.processing < this.concurrency) {
      // there is a free bot, process the job
      let job = this.queue.shift()!;

      this.processing += 1;

      this.handler(job!)
        .then((delay:number) => {
          if (!delay) delay = 0;

          // Allow users to request again before the promise resolve delay
          this.users[job.ip!]--;

          return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
              resolve();
            }, delay);
          });
        })
        .catch((err) => {
          if (err !== NoBotsAvailable) {
            job.attempts++;
          }

          if (job.attempts === job.max_attempts) {
            // job failed
            this.emit("job failed", job, err);
            this.users[job.ip!]--;
          } else {
            // try again
            this.queue.unshift(job);
          }
        })
        .then(() => {
          this.processing -= 1;
          this.checkQueue();
        });
    }
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.checkQueue();
    }
  }

  pause() {
    if (this.running) this.running = false;
  }

  /**
   * Returns number of requests the ip currently has queued
   */
  getUserQueuedAmt(ip: string) {
    return this.users[ip] || 0;
  }
}
