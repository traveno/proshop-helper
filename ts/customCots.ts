import * as $ from "jquery";

if ($("span.user_name").text() == "STEPHEN F") {
    $("table#dataTable tbody tr td:first-child").append(" (<a style=\"color: #F00;\" class=\"testbutton\" href=\"#\">create tag</a>)");

    $("a.testbutton").on("click", () => {
        console.log("https://adionsystems.com" + $(this).prev().attr("href"));
    });

    $("ul.breadcrumb").append("<li><a id=\"createTagButton\">Create Tag</a></li>");

    $("#createTagButton").on("click", () => {
        chrome.runtime.sendMessage({ type: "openCotsMenu" });
    });
}