export function delayMs(ms: number = 0) {
    return new Promise(resolve => { setTimeout(() => { resolve('') }, ms)});
}

export function debugInfo(info: string) {
    chrome.runtime.sendMessage({ type: "debug", file: "partsMenu.js", info: info });
}