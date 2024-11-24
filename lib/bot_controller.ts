import EventEmitter from "events";
import { Bot } from "./bot";
import { NoBotsAvailable } from "../errors";
import { shuffleArray } from "./utils";
type LoginData = {
  user: string;
  pass: string;
  auth?: string;
};
export class BotController extends EventEmitter {
  bots: Bot[] = [];
  readyEvent = false;
  constructor() {
    super();
  }

  addBot(loginData: LoginData, settings) {
    let bot = new Bot(settings);
    bot.logIn(loginData.user, loginData.pass, loginData.auth);

    bot.on("ready", () => {
      if (!this.readyEvent && this.hasBotOnline()) {
        this.readyEvent = true;
        this.emit("ready");
      }
    });

    bot.on("unready", () => {
      if (this.readyEvent && this.hasBotOnline() === false) {
        this.readyEvent = false;
        this.emit("unready");
      }
    });

    this.bots.push(bot);
  }

  getFreeBot() {
    // Shuffle array to evenly distribute requests
    for (let bot of shuffleArray(this.bots)) {
      if (!bot.busy && bot.ready) return bot;
    }

    return false;
  }

  hasBotOnline() {
    for (let bot of this.bots) {
      if (bot.ready) return true;
    }

    return false;
  }

  getReadyAmount() {
    let amount = 0;
    for (const bot of this.bots) {
      if (bot.ready) {
        amount++;
      }
    }
    return amount;
  }

  lookupFloat(data: any) {
    let freeBot = this.getFreeBot();

    if (freeBot) return freeBot.sendFloatRequest(data);
    else return Promise.reject(NoBotsAvailable);
  }
}
