window.onload = function() {
    var fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', function(e) {
        var file = fileInput.files[0];

        var reader = new FileReader();

        reader.onload = function(e) {
            
            myChip.init();
            myChip.loadProgram(new Uint8Array(reader.result));
            console.log(myChip);
        }

        reader.readAsArrayBuffer(file);
    });
}