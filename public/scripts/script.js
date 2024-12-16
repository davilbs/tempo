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

    var i = 0;
    var curr_width = 10;
    function updateBar(target, delay) {
        i = 1;
        var elem = document.getElementById("progress-bar");
        console.log("Atualizando barra ", curr_width, target);
        var id = setInterval(frame, delay, target);
        function frame(target) {
            console.log(curr_width, target)
            if (curr_width >= target) {
                console.log("Clearing interval for ", target)
                if (curr_width < 95) {
                    i = 0;
                }
                clearInterval(id);
            } else {
                curr_width++;
                elem.style.width = curr_width + "%";
            }
        }
    }

    function AddLoading(filename) {
        console.log("Adding loading for ", filename)
        var protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
        var host = window.location.host;
        var source = new EventSource(protocol + host + "/events?filename=" + filename);
        source.addEventListener('message', (message) => {
            console.log("received message", message);
            var data_json = JSON.parse(message.data)
            console.log(i)
            var delay = 20;
            var delta = (data_json.status_code + 1) * 33;
            if (i == 0) {
                console.log(data_json)
                if (data_json.status_code == 2){
                    delta -= 5;
                    delay = 100;
                }
                updateBar(delta, delay);
            }
            document.querySelector('#updatable-content').innerHTML = data_json.status_text
        });
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
            document.getElementById("loading-container").classList.add("hidden");
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
        if (file.files.length > 0) {
            document.getElementById("file-upload-form").submit()
            document.getElementById("loading-container").classList.remove("hidden");
            AddLoading(file.files[0].name)
        }
    }

    // Check for the various File API support.
    if (window.File && window.FileList && window.FileReader) {
        Init();
    }
}
ekUpload();
// regras de associacao
// predict potential top cluster prescriptors
// semaforo de atendimento