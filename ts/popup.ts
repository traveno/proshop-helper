import * as $ from "jquery";
import { debugInfo } from "./common";

$("#togglePlugin").on("click", () => {
    let button: JQuery<HTMLElement> = $("#togglePlugin");

    if (button.hasClass("btn-grad-enabled")) {
        button.removeClass("btn-grad-enabled");
        button.addClass("btn-grad-disabled");
        button.text("DISABLED");

        $(".btn").prop("disabled", true);

        // Disable extension
        chrome.storage.local.set({ enabled: false });
    } else {
        button.removeClass("btn-grad-disabled");
        button.addClass("btn-grad-enabled");
        button.text("ENABLED");

        $(".btn").prop("disabled", false);
        
        // Enable extension
        chrome.storage.local.set({ enabled: true });
    }
});

chrome.storage.local.get(["enabled"], function(result) {
    if (!result.enabled) {
        let button: JQuery<HTMLElement> = $("#togglePlugin");

        button.removeClass("btn-grad-enabled");
        button.addClass("btn-grad-disabled");
        button.text("DISABLED");

        $(".btn").prop("disabled", true);
    }
});

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

chrome.management.getSelf((result) => {
    document.getElementById("ver").innerHTML = "v" + result.version + "\t\t" + "Stephen Fike";
});

document.getElementById("openCotsSuite").onclick = () => {
    chrome.runtime.sendMessage({ type: "openCotsMenu" });
    window.close();
}

document.getElementById("openPartsSuite").onclick = () => {
    chrome.runtime.sendMessage({ type: "openPartsMenu" });
    window.close();
}

document.getElementById("openReporting").onclick = () => {
    chrome.runtime.sendMessage({ type: "openReportMenu" });
    window.close();
}