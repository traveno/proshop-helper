// Initialize button for generating tag
/*let generateTag = document.getElementById("generateTag");

// Add event listener for generateTag button
generateTag.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["payload.js"],
  });

  chrome.tabs.create({ url: "worktag.html"});
});*/

chrome.management.getSelf(function(result) {
  document.getElementById("ver").innerHTML = "You are running version " + result.version;
});