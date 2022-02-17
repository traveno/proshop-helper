// Define our global variables
// Only define once
if (typeof numPartStocks == "undefined") {
    // Keep track of how many part stocks there are
    // and how many we have looked at
    var numPartStocks = 0;
    var numPartStocksSearched = 0;

    var searchedPOs = new Array();

    // Our communication port
    var port = null;

    // Add listener to assign our global port variable when connected to
    chrome.runtime.onConnect.addListener(function(portInfo) {
        debug("adding listener");
        port = portInfo;
        port.onMessage.addListener(message => processPort(message));
    });
    
}

// Remove our port listener and then disconnect
function closePort() {
    debug("closePort called");
    port.onMessage.removeListener(processPort);
    port.disconnect();
}

// This function acts as listener for incoming messages
function processPort(message) {
    debug("processing port data");
    if (message.type == "executePayload") {
        scrapeData();
    }
}

// Checks if we've searched all possible part stocks
function checkSearchComplete() {
    if (numPartStocksSearched == numPartStocks && numPartStocks != 0) {
        port.postMessage({ type: "finishedSearch" });
        closePort();
        numPartStocks = numPartStocksSearched = 0;
        searchedPOs = new Array();
    }
}

// The meat and potatoes -- data scraping algorithm
function scrapeData() {
    debug("scrapeData called");

    // Reset/set our vars
    let woNumber = null;
    searchedPOs = new Array();

    try {
        woNumber = $("div#pageTitle.pageTitle.page a.htmlTooltip").text();
    } catch (error) {
        debug("Failed to obtain WO number. Are we on a WO page?");
        return;
    }
    
    port.postMessage({ type: "woNumber", data: woNumber });

    // Load up the part stock information for this WO number
    fetch("https://machinesciences.adionsystems.com/procnc/workorders/" + woNumber + "$formName=partStockStatus").then(res => res.text()).then(html => {
        const parser = new DOMParser();
        const partStockDoc = parser.parseFromString(html, "text/html");

        // Get a list of the part stocks
        let tables = $(partStockDoc).find("table.dashedTable");
        numPartStocks = tables.length;

        debug("found " + numPartStocks + " part stock(s)");

        // Loop through each part stock
        $(tables).each(function() {
            // PO number
            let partStock_poNumber = null;
            // Actual received quantity
            let partStock_actualQty = null;
            // Actual arrived date
            let partStock_actualArrived = null;

            // Attempt to scrape the part stock information
            try {
                partStock_poNumber = $(this).find("a.htmlTooltip span").eq(0).text();
                partStock_actualQty = $(this).find("tr td.sideHeader:contains('Actual Qty:')").next().text();
                partStock_actualArrived = $(this).find("tr td.sideHeader:contains('Actual Arrived:')").next().text().split(";")[0];
            } catch (error) {
                debug("Something went wrong");
                port.postMessage({ type: "finishedSearch" });
                closePort();
                return true;
            }

            // In case this is CSM and there is no ProShop material assigned
            // therefore, there is no purchase order
            if (partStock_poNumber == "") {
                numPartStocks--;
                checkSearchComplete();
                debug("partstock po number is ''");

                // Return true so jQuery continues this each() loop
                return true;
            }

            // Avoid searching duplicate POs
            if (searchedPOs.includes(partStock_poNumber)) {
                numPartStocks--;
                checkSearchComplete();
                debug("found a duplicate PO");

                // Return true so jQuery continues this each() loop
                return true;
            } else {
                searchedPOs.push(partStock_poNumber);
            }

            // Load up the purchase order
            fetch("https://machinesciences.adionsystems.com/procnc/purchaseorders/" + partStock_poNumber).then(res => res.text()).then(html => {
                const poDoc = parser.parseFromString(html, "text/html");

                // Get a list of all line items in this purchase order
                let poLineInfo = $(poDoc).find("table.poBody tbody tr td table tbody tr");

                // If the user lacks permission to view purchase orders
                // poLineInfo.length will be zero.
                // A better way to go about this should be to check user
                // permissions. This works for now, though.
                if (poLineInfo.length == 0) {
                    port.postMessage({
                        type: "partStockInfo",
                        po: partStock_poNumber.split("-")[0],
                        line: "N/A",
                        arrived: partStock_actualArrived == "" ? "N/R" : partStock_actualArrived,
                        qty: partStock_actualQty == "" ? "N/A" : partStock_actualQty
                    });

                    // Exit this async fetch
                    return;
                }

                // Loop through each line of the purchase order
                $(poLineInfo).each(function() {
                    let lineWoNumber = $(this).find("td.attValue a");

                    // Loop through each result
                    $(lineWoNumber).each(function() {
                        if ($(this).text() == woNumber) {
                            let linePoNumber = "";

                            if ($(this).parent().prop("tagName") == "SPAN")
                                linePoNumber = $(this).parent().parent().siblings().eq(0).text().split(" ")[0];
                            else
                                linePoNumber = $(this).parent().siblings().eq(0).text().split(" ")[0];

                            debug("we about to send it bruv " + $(this).text() + " == " + woNumber);
                            port.postMessage({
                                type: "partStockInfo",
                                po: partStock_poNumber.split("-")[0],
                                line: linePoNumber,
                                arrived: partStock_actualArrived == "" ? "N/R" : partStock_actualArrived,
                                qty: partStock_actualQty == "" ? "N/A" : partStock_actualQty
                            });
                        }

                        // Exit this async fetch
                        return;
                    });
                });
            }).then(function() {
                // We need to keep track of this because these fetch() calls are asynchronous
                numPartStocksSearched++;
                checkSearchComplete();
            });
        });
    });
}

function debug(info) {
    chrome.runtime.sendMessage({ type: "debug", file: "payload.js", info: info });
};