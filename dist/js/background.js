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
        chrome.windows.create({ url: "cotsMenu.html", width: 500, height: 500, type: "popup" });
    }

    if (request.type == "openPartsMenu") {
        chrome.windows.create({ url: "partsMenu.html", width: 500, height: 375, type: "popup" });
    }

    if (request.type == "debug") {
        debug(request.file, request.info);
    }
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