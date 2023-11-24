// File Upload
// 
function ekUpload() {
    function Init() {

        console.log("Upload Initialised");

        var fileSelect = document.getElementById('file-upload'),
            submitButton = document.getElementById('submit-button');

        fileSelect.addEventListener('change', fileSelectHandler, false);
        submitButton.addEventListener('click', uploadFile, false)
    }

    function fileSelectHandler(e) {
        // Fetch FileList object
        var files = e.target.files || e.dataTransfer.files;

        // Process all File objects
        for (var i = 0, f; f = files[i]; i++) {
            parseFile(f);
        }
    }

    // Output
    function output(msg) {
        // Response
        var m = document.getElementById('file-upload-btn');
        m.innerHTML = msg;
    }

    function parseFile(file) {
        console.log(file.name);
        var imageName = file.name;

        var isGood = (/\.(?=pdf|jpg|png|jpeg)/gi).test(imageName);
        if (!isGood) {
            document.getElementById('notimage').classList.remove("hidden");
            document.getElementById('form-container').classList.remove("upload-container");
            document.getElementById('form-container').classList.add("upload-container-error");
            output(
                'Selecionar Arquivo<i style="margin-left: 23px;" class="fa fa-upload"></i>'
            );
            document.getElementById("file-upload-form").reset();
        }
        else {
            document.getElementById('notimage').classList.add("hidden");
            document.getElementById('parseError').classList.add("hidden");
            document.getElementById('form-container').classList.add("upload-container");
            document.getElementById('form-container').classList.remove("upload-container-error");
            output(
                encodeURI(file.name) + '<i style="margin-left: 23px;" class="fa fa-upload"></i>'
            );
        }
    }

    function uploadFile(e) {
        e.preventDefault()
        const file = document.getElementById("file-upload")
        console.log(file.files)
        if(file.files.length > 0){
            document.getElementById("file-upload-form").submit()
        }
    }

    // Check for the various File API support.
    if (window.File && window.FileList && window.FileReader) {
        Init();
    }
}
ekUpload();