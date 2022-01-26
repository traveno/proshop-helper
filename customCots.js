if ($("span.user_name").text() == "STEPHEN F") {
    $("table#dataTable tbody tr td:first-child").append(" (<a style=\"color: #F00;\" class=\"testbutton\" href=\"#\">create tag</a>)");

    $("a.testbutton").click(function () {
        console.log("https://machinesciences.adionsystems.com" + $(this).prev().attr("href"));
    });

    $("ul.breadcrumb").append("<li><a id=\"createTagButton\">Create Tag</a></li>");
}