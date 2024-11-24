//@ts-ignore
global._mckay_statistics_opt_out = true; // Opt out of node-steam-user stats

const optionDefinitions = [
  { name: "config", alias: "c", type: String, defaultValue: "./config.js" }, // Config file location
  { name: "steam_data", alias: "s", type: String }, // Steam data directory
];
import winston from "winston";
import argsFn from "command-line-args";
import { BotController } from "./lib/bot_controller";
const botController = new BotController();
import { InspectURL, type InspectParams } from "./lib/inspect_url";
import rateLimit from "express-rate-limit";
import { Job } from "./lib/job";
const parsedArgs = argsFn(optionDefinitions);
import { Queue } from "./lib/queue";
/*   CONFIG = require(parsedArgs.config),
  postgres = new (require("./lib/postgres"))(
    CONFIG.database_url,
    CONFIG.enable_bulk_inserts
  ),
  gameData = new (require("./lib/game_data"))(
    CONFIG.game_files_update_interval,
    CONFIG.enable_game_file_updates
  ) */
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import * as utils from "./lib/utils";
import { BadBody, BadSecret, GenericBad, InvalidInspect, MaxQueueSize, MaxRequests, RateLimit } from "./errors";
import shareCodeRouter from "./lib/router";

const config = await import(parsedArgs.config);
const CONFIG = config.default;

if (CONFIG.max_simultaneous_requests === undefined) {
  CONFIG.max_simultaneous_requests = 1;
}
winston.level = CONFIG.logLevel || "debug";

if (CONFIG.logins.length === 0) {
  console.log("There are no bot logins. Please add some in config.json");
  process.exit(1);
}

if (parsedArgs.steam_data) {
  CONFIG.bot_settings.steam_user.dataDirectory = parsedArgs.steam_data;
}

for (let [i, loginData] of CONFIG.logins.entries()) {
  const settings = Object.assign({}, CONFIG.bot_settings);
  if (CONFIG.proxies && CONFIG.proxies.length > 0) {
    const proxy = CONFIG.proxies[i % CONFIG.proxies.length];

    if (proxy.startsWith("http://")) {
      settings.steam_user = Object.assign({}, settings.steam_user, {
        httpProxy: proxy,
      });
    } else if (proxy.startsWith("socks5://")) {
      settings.steam_user = Object.assign({}, settings.steam_user, {
        socksProxy: proxy,
      });
    } else {
      console.log(
        `Invalid proxy '${proxy}' in config, must prefix with http:// or socks5://`
      );
      process.exit(1);
    }
  }

  botController.addBot(loginData, settings);
}

// Setup and configure express
const app = express();
app.use(function (req, res, next) {
  if (req.method === "POST") {
    // Default content-type
    req.headers["content-type"] = "application/json";
  }
  next();
});
app.use(express.json({ limit: "5mb" }));

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  // Handle bodyParser errors
  if (error instanceof SyntaxError) {
    BadBody.respond(res);
  } else next();
});

if (CONFIG.trust_proxy === true) {
  app.enable("trust proxy");
}

CONFIG.allowed_regex_origins = CONFIG.allowed_regex_origins || ([] as string[]);
CONFIG.allowed_origins = CONFIG.allowed_origins || ([] as string[]);
const allowedRegexOrigins = CONFIG.allowed_regex_origins.map(
  (origin) => new RegExp(origin)
);


function canSubmitPrice(
  key: any,
  link: { isMarketLink: () => any },
  price: string
) {
  return (
    CONFIG.price_key &&
    key === CONFIG.price_key &&
    price &&
    link.isMarketLink() &&
    utils.isOnlyDigits(price)
  );
}

app.use(function (req: Request, res: Response, next: NextFunction) {
  if (CONFIG.allowed_origins.length > 0 && req.get("origin") != undefined) {
    // check to see if its a valid domain
    const allowed =
      CONFIG.allowed_origins.indexOf(req.get("origin")) > -1 ||
      allowedRegexOrigins.findIndex((reg:RegExp) => reg.test(req.get("origin"))) > -1;

    if (allowed) {
      res.header("Access-Control-Allow-Origin", req.get("origin"));
      res.header("Access-Control-Allow-Methods", "GET");
    }
  }
  next();
});

if (CONFIG.rate_limit && CONFIG.rate_limit.enable) {
  app.use(
    rateLimit({
      windowMs: CONFIG.rate_limit.window_ms,
      max: CONFIG.rate_limit.max,
      headers: false,
      handler: function (req, res) {
        RateLimit.respond(res);
      },
    })
  );
}

app.use("/sharecode", shareCodeRouter);

app.get("/stats", (req, res) => {
  res.json({
    bots_online: botController.getReadyAmount(),
    bots_total: botController.bots.length,
    /* queue_size: queue.queue.length,
    queue_concurrency: queue.concurrency, */
  });
});

const http_server = require("http").Server(app);
http_server.listen(CONFIG.http.port);
winston.info("Listening for HTTP on port: " + CONFIG.http.port);
/* 
queue.process(CONFIG.logins.length, botController, async (job) => {
  const itemData = await botController.lookupFloat(job.data.link);
  winston.debug(`Received itemData for ${job.data.link.getParams().a}`);

  // Save and remove the delay attribute
  let delay = itemData.delay;
  delete itemData.delay;

  // add the item info to the DB
  await postgres.insertItemData(itemData.iteminfo, job.data.price);

  // Get rank, annotate with game files
  itemData.iteminfo = Object.assign(
    itemData.iteminfo,
    await postgres.getItemRank(itemData.iteminfo.a)
  );
  gameData.addAdditionalItemProperties(itemData.iteminfo);

  itemData.iteminfo = utils.removeNullValues(itemData.iteminfo);
  itemData.iteminfo.stickers = itemData.iteminfo.stickers.map((s) =>
    utils.removeNullValues(s)
  );

  job.data.job.setResponse(job.data.link.getParams().a, itemData.iteminfo);

  return delay;
}); */
/* 
queue.on("job failed", (job, err) => {
  const params = job.data.link.getParams();
  winston.warn(
    `Job Failed! S: ${params.s} A: ${params.a} D: ${params.d} M: ${
      params.m
    } IP: ${job.ip}, Err: ${(err || "").toString()}`
  );

  job.data.job.setResponse(params.a, errors.TTLExceeded);
});
 */