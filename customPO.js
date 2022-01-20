$("table.poBody td.clsdHeader:contains(Other Files)").append("</br><button class=\"btn btn-raised btn-secondary\" type=\"button\" id=\"prettifyPO\" title=\"Prettify this PO\">Make Pretty</button>");

// Keep track of file counts so we know when to refresh
var numFiles = 0;
var numFilesProcessed = 0;

$("#prettifyPO").click(function() {
    // Get all purchase order files
    let editList = $("td.attValue[align='left'] div.hidden-buttons-wrapper a[title='Edit']");
    // Use a delay multiplier that we pass to our async function
    let delayMultiplier = 0;

    // Remove unnecessary work files
    // e.g. files that already look pretty
    $(editList).each(function() {
        let text = $(this).parent().parent().find("font a").get(0).childNodes[1].nodeValue;
        if (!text.includes("PO") && !text.includes("PS")) {
            // We found a candidate, so we increase numFiles and call renameFile()
            numFiles++;
            renameFile($(this).attr("onclick").split("'")[1], (delayMultiplier++) * 500);
            debug("renaming " + text);
        } else
            debug("skipping " + text);
    });

    // Button was clicked but we found no candidates
    if (numFiles == 0)
        debug("nothing found to rename");
});

async function renameFile(href, msDelay) {
    // Delay this function to avoid overloading the server
    await delay(msDelay);
    
    // Fetch the rename file page using the edit button's href
    fetch("https://machinesciences.adionsystems.com" + href).then(res => res.text()).then(html => {
        let parser = new DOMParser();
        let editFileDoc = parser.parseFromString(html, "text/html");

        // Find the file name text box on the rename page
        let filename = $(editFileDoc).find("form#linkEditForm input").eq(2);

        // Give the text box a new value that is pretty
        $(filename).val(makePretty($(filename).val()));

        // Take a snapshot of the completed form ready for submit
        const data = new URLSearchParams(new FormData(editFileDoc.getElementById("linkEditForm")));

        // Fetch the action page for the form and submit by POST
        fetch("https://machinesciences.adionsystems.com" + $(editFileDoc).find("form#linkEditForm").attr("action"), {
            method: "POST",
            body: data
        }).then(function() {
            // Keep track of our processed count
            numFilesProcessed++;

            // Create or update the status line below the Make Pretty button
            if (numFilesProcessed == 1)
                $("#prettifyPO").after("<br><br><p>Processed " + numFilesProcessed + " files of " + numFiles + "...</p>");
            else 
                $("#prettifyPO").siblings("p").html("<p>Processed " + numFilesProcessed + " files of " + numFiles + "...</p>");

            // renameFile is a delayed async func so numFilesProcessed should never outrun numFiles
            if (numFilesProcessed == numFiles) {
                // We're finished, reload the page
                location.reload();
            }
        });
    });
}

// This is the delay that is called in async functions
function delay(ms) {
    return new Promise(resolve => { setTimeout(() => { resolve('') }, ms)});
}

// Shared function from customRename.js
function makePretty(string) {
    // Check if it's empty, or if we've already prettified the text
    if (string == "" || string.includes("PO") || string.includes("PS"))
        return string;

    const textExplode = string.split("_");

    // Create our prettified version and insert it into the input field
    let newText = "PO" + textExplode[1].split("-")[0] + " PS" + textExplode[4];
    console.log(string + " -> " + newText);
    return newText;
}

function debug(info) {
    chrome.runtime.sendMessage({ type: "debug", file: "customPO.js", info: info });
};