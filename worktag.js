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

    $("#floater-inner").append("<div class=\"custom-row\"><center><p class=\"unselectable\">Create ProShop worktag</p></center></div>");

    // Populate floating window with part stock options
    for (const info of partStockInfos) {
        $("#floater-inner").append(`
        <div class="custom-row valign-wrapper">
            <div class="custom-column">
                <button class="partStockButton grey darken-3 btn-small" id="` + info.po + `">Select</button>
            </div>
            <div class="custom-column"><p>PO: ` + info.po + `</br>LINE: ` + info.line + `</p></div>
            <div class="custom-column"><p>QTY: ` + info.qty + `</br>REC: ` + info.arrived + `</p></div>
        </div>
        `);

        // Assign a function to the button onclick() event
        document.getElementById(info.po).onclick = function() {
            setPartStockInfo(info.po, info.line, info.arrived, info.qty);
        };
    }

    if (partStockInfos.length == 0) {
        $("#floater-inner").append("<center><p>No in-stock material</br>found for this work order</p></center>");
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
    $("#toolbar").removeClass("unselectable");
}

function addNonPartStockOptions() {
    $("#floater-inner").append(`
    <div class="custom-row">
        </br><button class="partStockButton grey darken-3 btn-small" id="omit">Omit part stock information</button>
        </br>
        </br><button class="partStockButton grey darken-3 btn-small" id="materialfixture">This is a material fixture</button></br></br>
    </div>
    <div class="custom-row valign-wrapper">
        <div class="custom-column"><center><p>Custom Date:</p></center></div>
        <div class="custom-column"><input type="text" class="datepicker"></div>
        <div class="custom-column"><button class="partStockButton grey darken-3 btn-small" id="customdate">Select</button></div>
    </div>
    <center><p class="unselectable"><b>REMINDER</b> &#8212; Print with margins set to <i>Default</i></p></center>
    `);

    // Init datepicker
    let date = $(".datepicker");
    M.Datepicker.init(date, { autoClose: true, format: "m/d/yyyy", defaultDate: new Date(), setDefaultDate: true });

    document.getElementById("customdate").onclick = function() {
        // Delete part stock div from HTML
        $(".part-stock-info").empty();

        // Get datepicker instance and convert to a string
        let instance = M.Datepicker.getInstance($(".datepicker"));
        $(".part-stock-info").append("</br><h2>REC " + instance.toString() + "</h2>");

        // Destroy datepicker
        instance.destroy();

        // Deblur the tag and remove the floating dialog
        $("div").removeClass("blurry");
        $("#floater").remove();
        $("#toolbar").removeClass("unselectable");
    }

    document.getElementById("omit").onclick = function() {
        // Delete part stock div from HTML
        $(".part-stock-info").remove();
        $("#qr-code1").prepend("</br>");
        $("#qr-code2").prepend("</br>");
        $("#qr-code3").prepend("</br>");
        $("#qr-code4").prepend("</br>");

        // Deblur the tag and remove the floating dialog
        $("div").removeClass("blurry");
        $("#floater").remove();
        $("#toolbar").removeClass("unselectable");
    }

    document.getElementById("materialfixture").onclick = function() {
        // Delete part stock div from HTML
        $(".part-stock-info").empty();
        $(".part-stock-info").append("</br><h2>Material Fixture</h2>");

        // Deblur the tag and remove the floating dialog
        $("div").removeClass("blurry");
        $("#floater").remove();
        $("#toolbar").removeClass("unselectable");
    }
}

document.getElementById("printPageButton").onclick = function() {
    window.print();
}

document.getElementById("closePageButton").onclick = function() {
    window.close();
}