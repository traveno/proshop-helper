import { delayMs, debugInfo } from "./common.js";

// Keep track of file counts so we know when to refresh
var numParts: number = 0;
var numPartsProcessed: number = 0;

var csvContent = "data:text/csv;charset=utf-8,";

$("#scrapeParts").on("click", () => {
    // Reset our global vars
    numParts = 0;
    numPartsProcessed = 0;

    // Disable button
    $("#scrapeParts").prop("disabled", true);

    debugInfo("partsMenu", "Starting parts scraping alg");

    // Fetch all parts within ProShop
    $("#status").text("Building list...");
    fetch("https://machinesciences.adionsystems.com/procnc/parts/searchresults$queryScope=global&queryName=query1&pName=parts").then(res => res.text()).then(html => {
        let parser: DOMParser = new DOMParser();
        let partListDoc: Document = parser.parseFromString(html, "text/html");    
    
        // Build a global parts list
        let partList: JQuery<HTMLElement> = $(partListDoc).find("table.dataTable tbody tr td:first-of-type > a.htmlTooltip").slice(0,20);
        numParts = partList.length;

        let delayMultiplier = 0;

        // Queue up our data scraping work
        $(partList).each(function() {
            scrapeDataFromPart($(this).attr("href"), (delayMultiplier++) * 500);
        });
    });
});

async function scrapeDataFromPart(href: string, msDelay: number) {
    // Delay this function to avoid overloading the server
    await delayMs(msDelay);
    
    // Fetch the part level page
    fetch("https://machinesciences.adionsystems.com" + href).then(res => res.text()).then(html => {
        let parser: DOMParser = new DOMParser();
        let partDoc: Document = parser.parseFromString(html, "text/html");

        // Grab a reference to the large OP table
        let opTable: JQuery<HTMLElement> = $(partDoc).find("table.proshop-table").eq(4);

        let partInfo: string = "";

        // Internal part number
        partInfo += $(partDoc).find("td#horizontalMainAtts_partNumber_value").text() + ",";

        // Internal part revision
        if ($(partDoc.getElementById("horizontalMainAtts_drawinginformation.v000001.latestpartrev.v000001_value")).has("a").length)
            partInfo += $(partDoc.getElementById("horizontalMainAtts_drawinginformation.v000001.latestpartrev.v000001_value")).find("a").text() + ",";
        else
            partInfo += $(partDoc.getElementById("horizontalMainAtts_drawinginformation.v000001.latestpartrev.v000001_value")).text() + ",";

        // Misc data
        partInfo += getValueFromOpTable(opTable,  20, 2 ) + ","; // OP 20 Operation Description
        partInfo += getValueFromOpTable(opTable,  20, 6 ) + ","; // OP 20 NR Set-up
        partInfo += getValueFromOpTable(opTable,  25, 2 ) + ","; // OP 25 Operation Description
        partInfo += getValueFromOpTable(opTable,  25, 6 ) + ","; // OP 25 NR Set-up
        partInfo += getValueFromOpTable(opTable,  30, 2 ) + ","; // OP 30 Operation Description
        partInfo += getValueFromOpTable(opTable,  30, 6 ) + ","; // OP 30 NR Set-up
        partInfo += getValueFromOpTable(opTable,  50, 2 ) + ","; // OP 50 Operation Description
        partInfo += getValueFromOpTable(opTable,  50, 1 ) + ","; // OP 50 Resource
        partInfo += getValueFromOpTable(opTable,  50, 5 ) + ","; // OP 50 Set-up
        partInfo += getValueFromOpTable(opTable,  50, 6 ) + ","; // OP 50 NR Set-up
        partInfo += getValueFromOpTable(opTable,  50, 8 ) + ","; // OP 50 Cycle
        partInfo += getValueFromOpTable(opTable,  50, 14) + ","; // OP 50 Min/Part
        partInfo += getValueFromOpTable(opTable,  60, 2 ) + ","; // OP 60 Operation Description
        partInfo += getValueFromOpTable(opTable,  60, 1 ) + ","; // OP 60 Resource
        partInfo += getValueFromOpTable(opTable,  60, 5 ) + ","; // OP 60 Set-up
        partInfo += getValueFromOpTable(opTable,  60, 8 ) + ","; // OP 60 Cycle
        partInfo += getValueFromOpTable(opTable,  60, 9 ) + ","; // OP 60 Change out
        partInfo += getValueFromOpTable(opTable,  60, 14) + ","; // OP 60 Min/Part
        partInfo += getValueFromOpTable(opTable,  60, 10) + ","; // OP 60 Inspection (FAI)
        partInfo += getValueFromOpTable(opTable,  61, 2 ) + ","; // OP 61 Operation Description
        partInfo += getValueFromOpTable(opTable,  61, 1 ) + ","; // OP 61 Resource
        partInfo += getValueFromOpTable(opTable,  61, 5 ) + ","; // OP 61 Set-up
        partInfo += getValueFromOpTable(opTable,  61, 8 ) + ","; // OP 61 Cycle
        partInfo += getValueFromOpTable(opTable,  61, 9 ) + ","; // OP 61 Change out
        partInfo += getValueFromOpTable(opTable,  61, 14) + ","; // OP 61 Min/Part
        partInfo += getValueFromOpTable(opTable,  61, 10) + ","; // OP 61 Inspection (FAI)
        partInfo += getValueFromOpTable(opTable, 500, 2 ) + ","; // OP 500 Operation Description
        partInfo += getValueFromOpTable(opTable, 500, 14) + ","; // OP 500 Min/Part

        // TODO Route information into a CSV file for download
        // For now we're simply outputting to the dev console
        console.log(partInfo);

    }).then(function() {
        // Keep track of how many we've processed
        // This is important because fetch() calls are async
        numPartsProcessed++;
        $("#status").text("Processed " + numPartsProcessed + " of " + numParts + "...");
    });
}

// This returns the data held in a cell of the op table as a string
// Empty cells return ""
function getValueFromOpTable(table, opCode, column) {
    let tableRows = $(table).find("tbody tr");
    let result = "";

    $(tableRows).each(function() {
        let rowOp = $(this).find("td:first-of-type > a").text();
        if (rowOp == opCode) {
            if ($(this).find("td").eq(column).children().length) {
                result = $(this).find("td").eq(column).eq(0).text();
            } else {
                result = $(this).find("td").eq(column).text();
            }
        }
    });

    return result.trim() ? result : "";
}