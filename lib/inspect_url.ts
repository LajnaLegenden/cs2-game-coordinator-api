import { isOnlyDigits } from './utils';

export type InspectParams = {
    s: string;
    a: string;
    d: string;
    m: string;
};

export class InspectURL {
    private readonly requiredParams: (keyof InspectParams)[] = ['s', 'a', 'd', 'm'];
    private s: string = '0';
    private a: string = '0';
    private d: string = '0';
    private m: string = '0';

    constructor(arg?: string | InspectParams | [string, string, string, string]) {
        if (typeof arg === 'string') {
            this.parseLink(arg);
        } else if (typeof arg === 'object' && !Array.isArray(arg)) {
            this.parseObject(arg);
        } else if (Array.isArray(arg) && arg.length === 4) {
            this.parseArray(arg);
        }
    }

    private parseObject(obj: InspectParams): void {
        for (const param of this.requiredParams) {
            if (obj[param] && typeof obj[param] === 'string' && obj[param].length > 0) {
                this[param] = obj[param];
            }
        }
    }

    private parseArray(arr: [string, string, string, string]): void {
        for (let i = 0; i < this.requiredParams.length; i++) {
            if (typeof arr[i] === 'string') {
                this[this.requiredParams[i]] = arr[i];
            }
        }
    }

    get valid(): boolean {
        return this.requiredParams.every(param => isOnlyDigits(this[param]));
    }

    parseLink(link: string): void {
        try {
            link = decodeURI(link);
        } catch (e) {
            // Catch URI Malformed exceptions
            return;
        }

        const regex = /^steam:\/\/rungame\/730\/\d+\/[+ ]csgo_econ_action_preview ([SM])(\d+)A(\d+)D(\d+)$/;
        const groups = regex.exec(link);

        if (groups) {
            if (groups[1] === 'S') {
                this.s = groups[2];
                this.m = '0';
            } else if (groups[1] === 'M') {
                this.m = groups[2];
                this.s = '0';
            }

            this.a = groups[3];
            this.d = groups[4];
        }
    }

    getParams(): InspectParams | undefined {
        return this.valid ? { s: this.s, a: this.a, d: this.d, m: this.m } : undefined;
    }

    isMarketLink(): boolean {
        return this.valid && this.m !== '0';
    }

    getLink(): string | undefined {
        if (!this.valid) return undefined;

        const baseURL = 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview';
        
        if (this.s === '0' && this.m !== '0') {
            return `${baseURL} M${this.m}A${this.a}D${this.d}`;
        } else {
            return `${baseURL} S${this.s}A${this.a}D${this.d}`;
        }
    }
}