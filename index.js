const express = require("express")
const fs = require("fs");
const multer = require("multer")
const path = require("path")

var app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage })

app.use(express.static("public"));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const spawn = require('child_process').spawn;

app.get("/", (req, res) => {
    res.render("index.ejs");
})

app.get("/table", (req, res) => {
    const py = spawn('python', [__dirname + '/scripts/getmeds.py']);

    let output = "";
    py.stdout.on("data", (data) => {
        output += data.toString();
    });

    py.on("close", () => {
        res.send({ items: JSON.parse(output).items });
    });
})

app.post("/calculate", upload.single("prescription"), (req, res, next) => {
    const file = req.file
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    res.redirect("/results?filename=" + req.file.filename)
});

app.get("/results", (req, res, next) => {
    const Path = require('path');
    var resultPath = Path.join(__dirname + "/processed/", req.query.filename.split('.')[0] + ".json");
    console.log("Caminho de teste " + resultPath);
    if (fs.existsSync(resultPath)) {
        console.log("Caminho encontrado");
        const py4 = spawn('python', [__dirname + '/scripts/calculatebudget.py', req.query.filename.split('.')[0] + ".json"]);

        let output4 = "";
        py4.stdout.on("data", (data) => {
            output4 += data.toString();

        });
        py4.on("close", () => {
            console.log(output4)
            try {
                let document = __dirname + "/scans/" + req.query.filename.split('.')[0] + ".txt"
                console.log(document)
                let inText = fs.readFileSync(document)
                res.render("resultado.ejs", { items: JSON.parse(output4).items, scanText: inText.toString().replace(/(?:\r\n|\r|\n)/g, '<br/>') });
            } catch (err) {
                console.log(err)
            }
        })
    } else {
        const py = spawn('python', [__dirname + '/scripts/tikaocr.py', req.query.filename]);

        let output = "";
        py.stdout.on("data", (data) => {
            output += data.toString();
        });

        py.on("close", () => {
            console.log(output);
            if (output != "fail") {
                const py2 = spawn('python', [__dirname + '/scripts/analyze.py', output]);
                let output2 = "";
                py2.stdout.on("data", (data) => {
                    output2 += data.toString();

                });
                py2.on("close", () => {
                    console.log(output2)
                    const py3 = spawn('python', [__dirname + '/scripts/calculatebudget.py', output2]);

                    let output3 = "";
                    py3.stdout.on("data", (data) => {
                        output3 += data.toString();

                    });
                    py3.on("close", () => {
                        console.log(output3)
                        try {
                            let document = __dirname + "/scans/" + output
                            console.log(document)
                            let inText = fs.readFileSync(document)
                            res.render("resultado.ejs", { items: JSON.parse(output3).items, scanText: inText.toString().replace(/(?:\r\n|\r|\n)/g, '<br/>') });
                        } catch (err) {
                            console.log(err)
                            res.render("index.ejs");
                        }
                    })
                });
            }
        });
    }
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})
