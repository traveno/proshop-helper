/* worktag.js */

var generated = false;
var partStockInfos = new Array();

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // Check if this tag is already finished
        if (generated) { return; }

        if (request.type == "partStockInfo") {
            // Check if this has actually been received
            if (request.arrived == "") { return; }

            partStockInfos.push({
                po: request.po,
                line: request.line,
                arrived: request.arrived,
                qty: request.qty
            });   
        }

        // Is this an incoming WO# from our scraper?
        if (request.type == "wo-number") {
            document.getElementById("title").innerHTML = "Tag for " + request.data;

            // Loop through our four tags
            for (let i = 1; i <= 4; i++) {
                var qrcode = new QRCode("qr-code" + i, {
                    width: 192,
                    height: 192,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.L
                });

                // Generate QR code
                qrcode.makeCode("https://machinesciences.adionsystems.com/procnc/workorders/" + request.data);

                // Set the correct WO#
                document.getElementById("work-order" + i).innerHTML = request.data;
            }

            // Update the loading text to look fancy
            document.getElementById("loadingText").innerHTML = "Searching part stocks</br>and purchase orders...";
        }

        // We've completed our search. Display results
        if (request.type == "finishedSearch") {
            createPartStockButtons();
            // Mark tag as finished so it stops listening for future events
            generated = true;
        }
});

function createPartStockButtons() {
    // Delete the loading text and animation
    $("#floater-inner").empty();

    // Populate floating window with part stock options
    for (const info of partStockInfos) {


        $("#floater-inner").append(`
        <div class="row">
            <div class="column">
                <button class="partStockButton" id="` + info.po + `">Select</button>
            </div>
            <div class="column">PO: ` + info.po + `</br>LINE: ` + info.line + `</div>
            <div class="column">QTY: ` + info.qty + `</br>REC: ` + info.arrived + `</div>
        </div>
        `);

        // Assign a function to the button onclick() event
        document.getElementById(info.po).onclick = function() {
            setPartStockInfo(info.po, info.line, info.arrived, info.qty);
        };
    }

    // Let's add other options
    addNonPartStockOptions();
}

function setPartStockInfo(po, line, arrived, qty) {
    // Populate part stock information using jQuery
    $(".po-data").html(po);
    $(".line-data").html(line);
    $(".rec-data").html(arrived);
   
    // Deblur the tag and remove the floating dialog
    $("div").removeClass("blurry");
    $("#floater").remove();

    // Mark tag as finished so it stops listening for future events
}

function addNonPartStockOptions() {
    $("#floater-inner").append("</br><button class=\"partStockButton\" id=\"omit\">Omit part stock information</button></br>");
    document.getElementById("omit").onclick = function() {
        // Delete part stock div from HTML
        $(".part-stock-info").remove();

        // Deblur the tag and remove the floating dialog
        $("div").removeClass("blurry");
        $("#floater").remove();
    }

    $("#floater-inner").append("</br><button class=\"partStockButton\" id=\"materialfixture\">This is a material fixture</button></br>");
    document.getElementById("materialfixture").onclick = function() {
        // Delete part stock div from HTML
        $(".part-stock-info").empty();
        $(".part-stock-info").append("</br></br><h2>Material Fixture</h2>");

        // Deblur the tag and remove the floating dialog
        $("div").removeClass("blurry");
        $("#floater").remove();
    }
}