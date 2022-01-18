// Find our input field that we wish to manipulate
var filename = $("form#linkEditForm input").eq(2);

// Inject our custom button
$("<button class=\"btn btn-raised btn-secondary\" type=\"button\" id=\"renameFile\" title=\"Prettify filename\">Make Pretty</button>").insertAfter(filename);

// Assign js to our custom button
$("#renameFile").click(function() {
    // Obtain the current value in the input field
    let text = $(filename).val();

    // Check if it's empty, or if we've already prettified the text
    if (text == "" || text.includes("PO") || text.includes("PS"))
        return;

    const textExplode = text.split("_");

    // Create our prettified version and insert it into the input field
    let newText = "PO" + textExplode[1].split("-")[0] + " PS" + textExplode[4];
    $(filename).val(newText);
});