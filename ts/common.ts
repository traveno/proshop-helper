export function delayMs(ms: number = 0) {
    return new Promise(resolve => { setTimeout(() => { resolve('') }, ms)});
}

export function debugInfo(subject: string = "Unknown", info: string): void {
    chrome.runtime.sendMessage({ type: "debug", file: subject, info: info });
}