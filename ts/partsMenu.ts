import * as $ from "jquery";
import { delayMs, debugInfo, getFullDate } from "./common";

enum opTableCol {
    OP = 0,
    RESOURCE,
    OPERATION_DESCRIPTION,
    OPERATION_TYPE,
    ROUTINGS,
    SET_UP,
    NR_SET_UP,
    EST_SET_UP,
    CYCLE,
    CHANGE_OUT,
    INSPECTION,
    NR_INSPECTION,
    BREAK_DOWN,
    RUNNING,
    MIN_PER_PART,
    EST_MIN_PER_PART
};

// Keep track of file counts so we know when to refresh
var numParts: number = 0;
var numPartsProcessed: number = 0;

// Our CSV builder string
var csvContent: string = "data:text/csv;charset=utf-8,";

$("#scrapeParts").on("click", () => {
    // Reset our global vars
    numParts = 0;
    numPartsProcessed = 0;

    // Disable button
    $("#scrapeParts").prop("disabled", true);

    debugInfo("partsMenu", "Start parts scraping alg");

    // Fetch all parts within ProShop
    $("#status").text("Building list...");
    fetch("https://machinesciences.adionsystems.com/procnc/parts/searchresults$queryScope=global&queryName=query1&pName=parts").then(res => res.text()).then(html => {
        let parser: DOMParser = new DOMParser();
        let partListDoc: Document = parser.parseFromString(html, "text/html");    
    
        // Build a global parts list
        let partList: JQuery<HTMLElement> = $(partListDoc).find("table.dataTable tbody tr td:first-of-type > a.htmlTooltip").slice(0,5);
        numParts = partList.length;

        let delayMultiplier = 0;

        // Queue up our data scraping work
        $(partList).each(function() {
            scrapeDataFromPart($(this).attr("href"), (delayMultiplier++) * 2000);
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

        // Init partInfo which will later be committed to our overall CSV string
        let partInfo: string = "";

        // Internal part number
        partInfo += $(partDoc).find("td#horizontalMainAtts_partNumber_value").text() + ",";

        // Internal part revision
        if ($(partDoc.getElementById("horizontalMainAtts_drawinginformation.v000001.latestpartrev.v000001_value")).has("a").length)
            partInfo += $(partDoc.getElementById("horizontalMainAtts_drawinginformation.v000001.latestpartrev.v000001_value")).find("a").text() + ",";
        else
            partInfo += $(partDoc.getElementById("horizontalMainAtts_drawinginformation.v000001.latestpartrev.v000001_value")).text() + ",";

        // Misc data
        partInfo += getValueFromOpTable(opTable,  20, opTableCol.OPERATION_DESCRIPTION) + ","; // OP 20 Operation Description
        partInfo += getValueFromOpTable(opTable,  20, opTableCol.NR_SET_UP            ) + ","; // OP 20 NR Set-up
        partInfo += getValueFromOpTable(opTable,  25, opTableCol.OPERATION_DESCRIPTION) + ","; // OP 25 Operation Description
        partInfo += getValueFromOpTable(opTable,  25, opTableCol.NR_SET_UP            ) + ","; // OP 25 NR Set-up
        partInfo += getValueFromOpTable(opTable,  30, opTableCol.OPERATION_DESCRIPTION) + ","; // OP 30 Operation Description
        partInfo += getValueFromOpTable(opTable,  30, opTableCol.NR_SET_UP            ) + ","; // OP 30 NR Set-up
        partInfo += getValueFromOpTable(opTable,  50, opTableCol.OPERATION_DESCRIPTION) + ","; // OP 50 Operation Description
        partInfo += getValueFromOpTable(opTable,  50, opTableCol.RESOURCE             ) + ","; // OP 50 Resource
        partInfo += getValueFromOpTable(opTable,  50, opTableCol.SET_UP               ) + ","; // OP 50 Set-up
        partInfo += getValueFromOpTable(opTable,  50, opTableCol.NR_SET_UP            ) + ","; // OP 50 NR Set-up
        partInfo += getValueFromOpTable(opTable,  50, opTableCol.CYCLE                ) + ","; // OP 50 Cycle
        partInfo += getValueFromOpTable(opTable,  50, opTableCol.MIN_PER_PART         ) + ","; // OP 50 Min/Part
        partInfo += getValueFromOpTable(opTable,  60, opTableCol.OPERATION_DESCRIPTION) + ","; // OP 60 Operation Description
        partInfo += getValueFromOpTable(opTable,  60, opTableCol.RESOURCE             ) + ","; // OP 60 Resource
        partInfo += getValueFromOpTable(opTable,  60, opTableCol.SET_UP               ) + ","; // OP 60 Set-up
        partInfo += getValueFromOpTable(opTable,  60, opTableCol.CYCLE                ) + ","; // OP 60 Cycle
        partInfo += getValueFromOpTable(opTable,  60, opTableCol.CHANGE_OUT           ) + ","; // OP 60 Change out
        partInfo += getValueFromOpTable(opTable,  60, opTableCol.MIN_PER_PART         ) + ","; // OP 60 Min/Part
        partInfo += getValueFromOpTable(opTable,  60, opTableCol.INSPECTION           ) + ","; // OP 60 Inspection (FAI)
        partInfo += getValueFromOpTable(opTable,  61, opTableCol.OPERATION_DESCRIPTION) + ","; // OP 61 Operation Description
        partInfo += getValueFromOpTable(opTable,  61, opTableCol.RESOURCE             ) + ","; // OP 61 Resource
        partInfo += getValueFromOpTable(opTable,  61, opTableCol.SET_UP               ) + ","; // OP 61 Set-up
        partInfo += getValueFromOpTable(opTable,  61, opTableCol.CYCLE                ) + ","; // OP 61 Cycle
        partInfo += getValueFromOpTable(opTable,  61, opTableCol.CHANGE_OUT           ) + ","; // OP 61 Change out
        partInfo += getValueFromOpTable(opTable,  61, opTableCol.MIN_PER_PART         ) + ","; // OP 61 Min/Part
        partInfo += getValueFromOpTable(opTable,  61, opTableCol.INSPECTION           ) + ","; // OP 61 Inspection (FAI)
        partInfo += getValueFromOpTable(opTable, 500, opTableCol.OPERATION_DESCRIPTION) + ","; // OP 500 Operation Description
        partInfo += getValueFromOpTable(opTable, 500, opTableCol.MIN_PER_PART         ) + ","; // OP 500 Min/Part

        // Fetch the list of 'recent' work orders for this part
        fetch("https://machinesciences.adionsystems.com" + href + "formName=ajaxHomeWorkOrderQuery").then(res => res.text()).then(html => {
            let inProcessDoc: Document = parser.parseFromString(html, "text/html");

            // Navigate the table and obtain a list of recent work orders
            let recentWOList: JQuery<HTMLElement> = $(inProcessDoc).find("table#dataTable tbody tr td:first-of-type a");

            // Check if the list is zero length
            if (recentWOList.length == 0) {
                // Commit partInfo to our CSV string
                addToCSV(partInfo + ",,,");
            } else {
                // Get the top-most work order (aka most recent)
                let mostRecentWO: JQuery<HTMLElement> = $(inProcessDoc).find("table#dataTable tbody tr td:first-of-type a").first();

                // Fetch the most recent work order page
                fetch("https://machinesciences.adionsystems.com" + mostRecentWO.attr("href")).then(res => res.text()).then(html => {
                    let mostRecentWODoc: Document = parser.parseFromString(html, "text/html");

                    // Get the op table from the work order page
                    let mostRecentWO_opTable: JQuery<HTMLElement> = $(mostRecentWODoc).find("table.proshop-table").eq(5);

                    // Get the data points we need
                    // Columns are swapped on the work order OP table (for whatever reason), so beware...
                    partInfo += getValueFromOpTable(mostRecentWO_opTable, 50, 2) + ","; // OP 50 Resource
                    partInfo += getValueFromOpTable(mostRecentWO_opTable, 60, 2) + ","; // OP 60 Resource
                    partInfo += getValueFromOpTable(mostRecentWO_opTable, 61, 2) + ","; // OP 61 Resource

                    // Commit partInfo to our CSV string
                    addToCSV(partInfo);
                });
            }
        });
    });
}

function addToCSV(data: string): void {
    numPartsProcessed++;
    $("#status").text("Processed " + numPartsProcessed + " of " + numParts + "...");
    csvContent += data;

    console.log(data);

    // Is the algorithm complete?
    // Download the file!
    if (numPartsProcessed == numParts) {
        $("#status").text("Complete!");
        let encodedURI: string = encodeURI(csvContent);
        let downloadButton = document.createElement("a");
        downloadButton.setAttribute("href", encodedURI);
        downloadButton.setAttribute("download", "allparts_" + getFullDate());
        document.body.appendChild(downloadButton);
        downloadButton.click();
    }
}

// This returns the data held in a cell of the op table as a string
// Empty cells return ""
function getValueFromOpTable(table: JQuery<HTMLElement>, opCode: number, column: number): string {
    let tableRows: JQuery<HTMLElement> = $(table).find("tbody tr");
    let result: string = "";

    $(tableRows).each(function() {
        let rowOp: string = $(this).find("td:first-of-type > a").text();
        if (rowOp == opCode.toString()) {
            if ($(this).find("td").eq(column).children().length) {
                result = $(this).find("td").eq(column).eq(0).text();
            } else {
                result = $(this).find("td").eq(column).text();
            }
        }
    });

    return result.trim() ? result : "";
}