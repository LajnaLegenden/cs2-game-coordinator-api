import https from 'https';
import fs from 'fs';

/**
 * Downloads the given HTTPS file
 * @param url The URL of the file to download
 * @param cb Callback function to handle the downloaded data
 */
export const downloadFile = (url: string, cb: (data?: string) => void): void => {
    https.get(url, (res) => {
        if (res.statusCode !== 200) {
            cb();
            return;
        }

        res.setEncoding('utf8');
        let data = '';

        res.on('error', () => cb());
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => cb(data));
    });
};

/**
 * Checks if the specified path is a directory and exists
 * @param path The path to check
 * @returns A boolean indicating if the path is a valid directory
 */
export const isValidDir = (path: string): boolean => {
    try {
        return fs.statSync(path).isDirectory();
    } catch {
        return false;
    }
};

/**
 * Checks if the string contains only digits
 * @param num The string to check
 * @returns A boolean indicating if the string contains only digits
 */
export const isOnlyDigits = (num: string): boolean => /^\d+$/.test(num);

/**
 * Filters the keys in the given object and returns a new one
 * @param keys The keys to filter
 * @param obj The object to filter
 * @returns A new object with only the specified keys
 */
export const filterKeys = <T extends Record<string, unknown>>(keys: string[], obj: T): Partial<T> => {
    return keys.reduce((result: Partial<T>, key) => {
        if (key in obj) result[key] = obj[key];
        return result;
    }, {} as Partial<T>);
};

/**
 * Removes keys with null values from an object
 * @param obj The object to process
 * @returns A new object without null values
 */
export const removeNullValues = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
    return Object.entries(obj).reduce((result, [key, value]) => {
        if (value !== null) {
            result[key as keyof T] = value;
        }
        return result;
    }, {} as Partial<T>);
};

/**
 * Converts an unsigned 64-bit integer to a signed 64-bit integer
 * @param num The unsigned 64-bit integer
 * @returns The signed 64-bit integer
 */
export const unsigned64ToSigned = (num: bigint | string): bigint => {
    const mask = 1n << 63n;
    return (BigInt(num) ^ mask) - mask;
};

/**
 * Converts a signed 64-bit integer to an unsigned 64-bit integer
 * @param num The signed 64-bit integer
 * @returns The unsigned 64-bit integer
 */
export const signed64ToUnsigned = (num: bigint | string): bigint => {
    const mask = 1n << 63n;
    return (BigInt(num) + mask) ^ mask;
};

/**
 * Checks whether the given ID is a SteamID64
 * @param id The ID to check
 * @returns A boolean indicating if the ID is a valid SteamID64
 */
export const isSteamId64 = (id: bigint | string): boolean => {
    const bigIntId = BigInt(id);
    const universe = bigIntId >> 56n;
    if (universe > 5n) return false;

    const instance = (bigIntId >> 32n) & ((1n << 20n) - 1n);
    return instance <= 32n;
};

/**
 * Chunks array into sub-arrays of the given size
 * @param arr The array to chunk
 * @param size The size of each chunk
 * @returns An array of chunked sub-arrays
 */
export const chunkArray = <T>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, (i + 1) * size)
    );
};

/**
 * Shuffles an array in place
 * @param arr The array to shuffle
 * @returns The shuffled array
 */
export const shuffleArray = <T>(arr: T[]): T[] => {
    return arr
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
};