var DEBUG_MODE = true;

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

    if (request.type == "generateTag") {
        getCurrentTab().then(function(tabCurrent) {
            chrome.tabs.create({ url: "worktag.html" }).then(function(tabWorktag) {
                debug("background", "created worktag tab");
                chrome.scripting.executeScript({
                    target: { tabId: tabCurrent.id },
                    files: ["js/build/payload.js"],
                }).then(async function() {
                    // Sometimes slow computers miss this command,
                    // so I add a little delay
                    await delay(250);
                    debug("background", "sending setPortInfo command");
                    chrome.tabs.sendMessage(tabWorktag.id, { type: "setPortInfo", portInfo: tabCurrent });
                });
            });
        });
    }

    if (request.type == "openCotsMenu") {
        chrome.storage.local.get(["perm_cots"], function (result) {
            if (result.perm_cots)
                chrome.windows.create({ url: "cotsMenu.html", width: 500, height: 500, type: "popup" });
        });
    }

    if (request.type == "openPartsMenu") {
        chrome.storage.local.get(["perm_parts"], function (result) {
            if (result.perm_parts)
                chrome.windows.create({ url: "partsMenu.html", width: 500, height: 375, type: "popup" });
        });
    }

    if (request.type == "openReportMenu") {
        chrome.storage.local.get(["perm_reporting"], function (result) {
            if (result.perm_reporting)
                chrome.windows.create({ url: "reportMenu.html", width: 1280, height: 1000, type: "popup" });
        });
    }

    if (request.type == "debug") {
        debug(request.file, request.info);
    }

    Promise.resolve("").then(result => sendResponse(result));
    return true;
});

function delay(ms) {
    return new Promise(resolve => { setTimeout(() => { resolve('') }, ms)});
}

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function debug(file, info) {
    if (DEBUG_MODE)
        console.log(file + ": " + info);
}

chrome.runtime.onInstalled.addListener(function(info) {
    if (info.reason == "install") {
        chrome.storage.local.set({ enabled: true });
        chrome.storage.local.set({ perm_cots: false, perm_parts: false, perm_reporting: false });
        debug("background", "extension installed and enabled");
    } else if (info.reason == "update") {
        chrome.storage.local.set({ enabled: true });
        chrome.storage.local.set({ perm_cots: false, perm_parts: false, perm_reporting: false });
        debug("background", "extension updated");
    }
});