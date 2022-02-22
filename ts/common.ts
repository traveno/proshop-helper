export function delayMs(ms: number = 0) {
    return new Promise(resolve => { setTimeout(() => { resolve('') }, ms)});
}

export function debugInfo(subject: string = "Unknown", info: string): void {
    chrome.runtime.sendMessage({ type: "debug", file: subject, info: info });
}

export function getFullDate(): string {
    let date = new Date();
    return date.getFullYear() + "-" +
           (date.getMonth() + 1) + "-" +
           date.getDate() + "@" +
           date.getHours() + "-" +
           date.getMinutes() + "-" +
           date.getSeconds() + "-" +
           date.getMilliseconds();
}