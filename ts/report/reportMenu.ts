import * as $ from "jquery";

class PSCache {
    
}

$("#cache_input").on("change", function() {
    let reader = new FileReader();
    let file: File = ($(this).get(0) as HTMLInputElement).files[0];

    reader.readAsText(file);

    reader.onloadend = readerEvent => {
        let content = readerEvent.target.result;

        console.log(content);
    }
});