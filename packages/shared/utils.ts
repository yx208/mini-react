export function getCurrentTime() {
    return performance.now();
}

export function isArray(sth: any) {
    return Array.isArray(sth);
}

export function isNumber(sth: any) {
    return typeof sth === 'number';
}

export function isObject(sth: any) {
    return typeof sth === 'object';
}

export function isFunction(sth: any) {
    return typeof sth === 'function';
}

export function isStr(sth: any) {
    return typeof sth === 'string';
}

export function isNotEmptyString(sth: any) {
    return typeof sth === 'string' && sth !== "";
}

export function isValidObject(sth: any) {
    return typeof sth === 'object' && sth !== null;
}
