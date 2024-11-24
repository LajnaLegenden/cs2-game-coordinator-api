import type { Request, Response } from "express";
import type { InspectURL } from "./inspect_url";
import { Error } from "../errors";

// A Job encapsulates fetching multiple links for a single request
export class Job {
    get ip() {
        return this.req.ip;
    }

    index: number;
    remainingLinks: unknown[];
    responses: Record<string, any>;
    attempts: number;
    max_attempts: number;



    constructor(public req: Request, public res: Response) {
        this.req = req;
        this.res = res;
        this.remainingLinks = [];
        this.index = 0;
        this.responses = {};
        this.attempts = 0;
        this.max_attempts = 3;
    }

    add(link: InspectURL, price: number | undefined) {
        this.remainingLinks.push({
            link,
            price,
            job: this,
        });
    }

 

    remainingSize() {
        return this.remainingLinks.length;
    }

    getLink(aParam) {
        return this.remainingLinks.find(e => e.link.getParams().a == aParam);
    }

    setResponseRemaining(response) {
        // Prevent operating on mutating list size
        for (const link of [...this.remainingLinks]) {
            this.setResponse(link.link.getParams().a, response);
        }
    }

    setResponse(assetId, response) {
        const index = this.remainingLinks.findIndex(e => e.link.getParams().a == assetId);
        if (index === -1) {
            return;
        }

        if (response instanceof Error) {
            response = response.getJSON();
        }

        this.responses[assetId.toString()] = response;
        this.remainingLinks.splice(index, 1);

        if (this.remainingLinks.length === 0) {
            this._reply();
        }
    }

    _reply() {
        const keys = Object.keys(this.responses);

        if (keys.length === 0) {
            return;
        }

        if (keys.length > 1) {
            this.res.json(this.responses);
        } else {
            const response = this.responses[keys[0]];
            if (response.error) {
                this.res.status(response.status).json(response);
            } else {
                this.res.json({iteminfo: response});
            }
        }
    }
}

