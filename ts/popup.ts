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

        checkPermissions();
        
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
    } else
        checkPermissions();
});

function checkPermissions(): void {
    

    chrome.storage.local.get(["perm_cots", "perm_parts", "perm_reporting"], function(perms) {
        if (perms.perm_cots)
            $("#openCotsSuite").prop("disabled", false);
        else
            $("#openCotsSuite").prop("disabled", true);
        if (perms.perm_parts)
            $("#openPartsSuite").prop("disabled", false);
        else
            $("#openPartsSuite").prop("disabled", true);
        if (perms.perm_reporting)
            $("#openReporting").prop("disabled", false);
        else
            $("#openReporting").prop("disabled", true);
    });

}

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
    document.getElementById("ver").innerHTML = "v" + result.version;
});

$("#openCotsSuite").on("click", () => {
    chrome.runtime.sendMessage({ type: "openCotsMenu" });
    window.close();
});

$("#openPartsSuite").on("click", () => {
    chrome.runtime.sendMessage({ type: "openPartsMenu" });
    window.close();
});

$("#openReporting").on("click", () => {
    chrome.runtime.sendMessage({ type: "openReportMenu" });
    window.close();
});