import * as $ from "jquery";
import { makePretty } from "./customPO";

// Find our input field that we wish to manipulate
var filepath: JQuery<HTMLElement> = $("form#linkEditForm input").eq(1);
var filename: JQuery<HTMLElement> = $("form#linkEditForm input").eq(2);

// Inject our custom button
$("<button class=\"btn btn-raised btn-secondary\" type=\"button\" id=\"renameFile\" title=\"Prettify filename\">Rename</button>").insertAfter(filename);

// Assign js to our custom button
$("#renameFile").on("click", () => {
    // Obtain the current value in the input field
    let text: string = $(filename).val() as string;

    // Check if it's empty, or if we've already prettified the text
    if (text == "" || text.includes("PO") || text.includes("PS"))
        return;

    // Create our prettified version and insert it into the input field
    $(filename).val(makePretty(text));
});