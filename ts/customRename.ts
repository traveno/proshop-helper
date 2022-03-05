import * as $ from "jquery";
import { makePretty } from "./customPO";

chrome.storage.local.get(["enabled"], function(result) {
    if (result.enabled) {
        $("form#linkEditForm input").eq(2).after("<button class=\"btn btn-raised btn-secondary\" type=\"button\" id=\"renameFile\" title=\"Prettify filename\">Rename</button>");
        $("#renameFile").on("click", renameFile);
    }
});

function renameFile(): void {
    // Find our input field that we wish to manipulate
    var filepath: JQuery<HTMLElement> = $("form#linkEditForm input").eq(1);
    var filename: JQuery<HTMLElement> = $("form#linkEditForm input").eq(2);

    // Obtain the current value in the input field
    let text: string = $(filepath).val() as string;

    // Check if it's empty, or if we've already prettified the text
    if (text == "" || text.includes("PO") || text.includes("PS"))
        return;

    // Create our prettified version and insert it into the input field
    $(filename).val(makePretty(text));
}