import * as $ from "jquery";
import { debugInfo, delayMs } from "./common";

// Our ProShop base URL
var baseURL: string = "";

// Add our button if extension is enabled
chrome.storage.local.get(["enabled", "ps_url"], function(result) {
    if (result.enabled) {
        $("table.poBody td.clsdHeader:contains(Other Files)").append("</br><button class=\"btn btn-raised btn-secondary\" type=\"button\" id=\"prettifyPO\" title=\"Prettify this PO\">Rename All</button>");
        $("#prettifyPO").on("click", bulkRename);
    }

    if (result.ps_url != undefined)
        baseURL = result.ps_url;
});

// Keep track of file counts so we know when to refresh
var numFiles: number = 0;
var numFilesProcessed: number = 0;

// Rename all PO files
function bulkRename(): void {
    // Get all purchase order files
    let editList: JQuery<HTMLElement> = $("td.attValue[align='left'] div.hidden-buttons-wrapper a[title='Edit']");
    // Use a delay multiplier that we pass to our async function
    let delayMultiplier: number = 0;

    // Remove unnecessary work files
    // e.g. files that already look pretty
    $(editList).each(function() {
        let text: string = $(this).parent().parent().find("font a").get(0).childNodes[1].nodeValue;
        if (!text.includes("PO") && !text.includes("PS")) {
            // We found a candidate, so we increase numFiles and call renameFile()
            numFiles++;
            renameFile($(this).attr("onclick").split("'")[1], (delayMultiplier++) * 500);
            debugInfo("customPO", "renaming " + text);
        } else
            debugInfo("customPO", "skipping " + text);
    });

    // Button was clicked but we found no candidates
    if (numFiles == 0)
        debugInfo("customPO", "nothing found to rename");
}

async function renameFile(href: string, msDelay: number) {
    // Delay this function to avoid overloading the server
    await delayMs(msDelay);
    
    // Fetch the rename file page using the edit button's href
    fetch(baseURL + href).then(res => res.text()).then(html => {
        let parser = new DOMParser();
        let editFileDoc = parser.parseFromString(html, "text/html");

        // Find the file name text box on the rename page
        var filepath: JQuery<HTMLElement> = $(editFileDoc).find("form#linkEditForm input").eq(1);
        let filename: JQuery<HTMLElement> = $(editFileDoc).find("form#linkEditForm input").eq(2);

        // Give the text box a new value that is pretty
        $(filename).val(makePretty($(filepath).val() as string));

        // Take a snapshot of the completed form ready for submit
        const data: URLSearchParams = new URLSearchParams(new FormData(editFileDoc.getElementById("linkEditForm") as HTMLFormElement) as URLSearchParams);

        // Fetch the action page for the form and submit by POST
        fetch(baseURL + $(editFileDoc).find("form#linkEditForm").attr("action"), {
            method: "POST",
            body: data
        }).then(() => {
            // Keep track of our processed count
            numFilesProcessed++;

            // Create or update the status line below the Make Pretty button
            if (numFilesProcessed == 1)
                $("#prettifyPO").after("<br><br><p>Processed " + numFilesProcessed + " of " + numFiles + " files...</p>");
            else 
                $("#prettifyPO").siblings("p").html("<p>Processed " + numFilesProcessed + " of " + numFiles + " files...</p>");

            // renameFile is a delayed async func so numFilesProcessed should never outrun numFiles
            if (numFilesProcessed == numFiles) {
                // We're finished, reload the page
                location.reload();
            }
        });
    });
}

// Shared function from customRename.js
export function makePretty(string: string): string {
    // Check if it's empty, or if we've already prettified the text
    if (string == "" || string.includes("PO") || string.includes("PS"))
        return string;

    const textExplode = string.split("_");

    // Create our prettified version and insert it into the input field
    let newText: string = "PO" + textExplode[1].split("-")[0] + " PS" + textExplode[2] + ".pdf";
    debugInfo("customPO", string + " -> " + newText);
    return newText;
}