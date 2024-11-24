import type { Response } from "express";

export class Error {
  code: number;
  constructor(
    public message: string,
    internalCode: number,
    public statusCode: number
  ) {
    this.code = internalCode;
  }

  getJSON() {
    return { error: this.message, code: this.code, status: this.statusCode };
  }

  respond(res: Response) {
    res.status(this.statusCode).json(this.getJSON());
  }

  toString() {
    return `[Code ${this.code}] - ${this.message}`;
  }
}

export const BadParams = new Error("Improper Parameter Structure", 1, 400);
export const InvalidInspect = new Error(
  "Invalid Inspect Link Structure",
  2,
  400
);
export const MaxRequests = new Error(
  "You have too many pending requests",
  3,
  400
);
export const TTLExceeded = new Error(
  "Valve's servers didn't reply in time",
  4,
  500
);
export const SteamOffline = new Error(
  "Valve's servers appear to be offline, please try again later",
  5,
  503
);
export const GenericBad = new Error(
  "Something went wrong on our end, please try again",
  6,
  500
);
export const BadBody = new Error("Improper body format", 7, 400);
export const BadSecret = new Error("Bad Secret", 8, 400);
export const NoBotsAvailable = new Error(
  "No bots available to fulfill this request",
  9,
  500
);
export const RateLimit = new Error("Rate limit exceeded, too many requests", 10, 429);
export const MaxQueueSize = new Error(
  "Queue size is full, please try again later",
  11,
  500
);
