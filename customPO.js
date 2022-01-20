$("table.poBody td.clsdHeader:contains(Other Files)").append("</br><button class=\"btn btn-raised btn-secondary\" type=\"button\" id=\"prettifyPO\" title=\"Prettify this PO\">Make Pretty</button>");

var numLines = 0;
var numLinesProcessed = 0;

$("#prettifyPO").click(doWork);

function doWork() {
    let editList = $("td.attValue[align='left'] div.hidden-buttons-wrapper a[title='Edit']");
    let delayMultiplier = 0;

    // Remove unnecessary work
    $(editList).each(function() {
        let text = $(this).parent().parent().find("font a").get(0).childNodes[1].nodeValue;
        if (!text.includes("PO") && !text.includes("PS")) {
            numLines++;

            renameFile($(this).attr("onclick").split("'")[1], (delayMultiplier++) * 500);
            debug("renaming " + text);
        } else
            debug("skipping " + text);
    });

    if (numLines == 0)
        debug("nothing found to rename");
}

async function renameFile(href, msDelay) {
    // Delay this function to avoid overloading the server
    await delay(msDelay);
    
    fetch("https://machinesciences.adionsystems.com" + href).then(res => res.text()).then(html => {
        let parser = new DOMParser();
        let editFileDoc = parser.parseFromString(html, "text/html");

        let filename = $(editFileDoc).find("form#linkEditForm input").eq(2);

        $(filename).val(makePretty($(filename).val()));

        $(editFileDoc).find("form#linkEditForm").submit();

        const data = new URLSearchParams(new FormData(editFileDoc.getElementById("linkEditForm")));

        fetch("https://machinesciences.adionsystems.com" + $(editFileDoc).find("form#linkEditForm").attr("action"), {
            method: "POST",
            body: data
        }).then(function() {
            numLinesProcessed++;

            if (numLinesProcessed == 1)
                $("#prettifyPO").after("<br><br><p>Processed " + numLinesProcessed + " files of " + numLines + "...</p>");
            else 
                $("#prettifyPO").siblings("p").html("<p>Processed " + numLinesProcessed + " files of " + numLines + "...</p>");

            if (numLinesProcessed == numLines) {
                location.reload();
            }
        });
    });
}

function delay(ms) {
    return new Promise(resolve => { setTimeout(() => { resolve('') }, ms)});
}

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