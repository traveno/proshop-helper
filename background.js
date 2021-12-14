chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

    if (request.type == "generateTag") {
        getCurrentTab().then(function(data) {

            chrome.scripting.executeScript({
                target: { tabId: data.id },
                files: ["payload.js"],
            });
        })

        chrome.tabs.create({ url: "worktag.html"});
    }
});

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}