chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  if (request.type === "queryPartStocks") {
    var url = "https://machinesciences.adionsystems.com/procnc/workorders/" 
              + request.data + "$formName=partStockStatus&isPopup=yes";
      fetch(url).then(res => res.text()).then(html => {
        //const parser = new DOMParser();
        //const htmlDoc = parser.parseFromString(html, "text/html");
        //console.log(htmlDoc.querySelector('title').textContent);
        //console.log(html);
        //console.log("see it?");
      });
      return true;  // Will respond asynchronously.
  } else if (request.type === "generateTag") {
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
  console.log("returning id " + tab.id);
  return tab;
}