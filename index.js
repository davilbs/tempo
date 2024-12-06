const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const http = require('http');
const https = require('https');
const md5 = require("md5");
const session = require('express-session');

var app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        console.log("Got filename salt", req.session.salt)
        cb(null, md5(file.originalname + req.session.salt) + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage })

app.use(express.static("public", { dotfiles: 'allow' }));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: true, cookie: { maxAge: 60000 } }));

const spawn = require('child_process').spawn;

app.get("/", (req, res) => {
    if (req.session.salt) {
        console.log("Salt already setup");
    } else {
        req.session.salt = md5(Date.now())
        console.log("Setup salt to", req.session.salt)
    }
    res.render("index.ejs", { parseError: false });
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
    const file = req.file;
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }
    res.redirect("/orcamento?filename=" + req.file.filename);
});

app.get('/events', async function (req, res) {
    var loading_status = "Fazendo upload do arquivo... (1/2)";
    var loading_code = 0;

    console.log("Current status", loading_status);
    console.log('Got /events with argument ' + req.query.filename);
    let filename = md5(req.query.filename + req.session.salt);
    let curr_ext = path.extname(req.query.filename);
    let directory = __dirname + "/uploads/";
    console.log("Filename: " + filename)
    res.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();

    // Tell the client to retry every 10 seconds if connectivity is lost
    res.write('retry: 10000\n\n');

    let connected = true;
    req.on("close", () => {
        console.log("Final status", loading_status);
        console.log("Connection ended unexpectedly");
        connected = false;
    })
    req.on("end", () => {
        console.log("Final status", loading_status);
        console.log("Connection ended normally");
        connected = false;
    })
    console.log("Looking for file: " + directory + filename + curr_ext);
    while (connected) {
        if (fs.existsSync(directory + filename + curr_ext)) {
            console.log('Progress ... ', directory + filename + curr_ext);
            if (curr_ext == ".json") {
                loading_status = "Processo finalizado!";
                loading_code = 3;
                connected = false;
            }
            else {
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log("Looking for file: " + directory + filename + curr_ext);
                curr_ext = ".json";
                directory = __dirname + "/processed/";
                loading_status = "Identificando medicamentos... (2/2)";
                loading_code = 2;
                console.log("Looking for file: " + directory + filename + curr_ext);
            }
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        res.write(`data: {"status_text": "${loading_status}", "status_code": ${loading_code}}\n\n`);
    }

})


async function extractPrescription(pdf_path) {
    var content = JSON.stringify({ "filename": pdf_path });
    var options = {
        hostname: 'localhost',
        port: 8000,
        path: "/extract_prescription",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(content)
        }
    };

    return new Promise(function (resolve, reject) {
        console.log("Sending request to extract prescription");
        let r = http.request(options, function (res) {
            res.setEncoding('utf8');
            if (res.statusCode == 200) {
                console.log("Got with status code 200");
                resolve(res.body);
            } else {
                console.log("Got ERROR");
                reject(res.err);
            }
        });
        r.write(content);
        r.end();
    });
}

app.get("/orcamento", function (req, res, next) {
    var json_path = path.join(__dirname + "/processed/", req.query.filename.split('.')[0] + ".json");
    if (fs.existsSync(json_path)) {
        var content = fs.readFileSync(json_path);
        var data = JSON.parse(content);
        res.render("orcamento_edit.ejs", formatOrcamentoEdited(data));
        return;
    }

    var pdf_path = path.join(__dirname + "/uploads/", req.query.filename);
    console.log("check existing file " + pdf_path);
    do {
        console.log("waiting for file " + pdf_path);
    } while (!fs.existsSync(pdf_path))

    extractPrescription(pdf_path)
        .then(function (body) {
            // Wait for the file to be processed
            console.log("File processed");
            var json_path = path.join(__dirname + "/processed/", req.query.filename.split('.')[0] + ".json");
        
            var content = fs.readFileSync(json_path);
            var data = JSON.parse(content);
        
            // Render the page with the data 
            res.render("orcamento_edit.ejs", formatOrcamentoEdited(data));
        })
        .catch((err) => {
            console.log("Error");
        });
})

function formatOrcamentoEdited(orcamentos) {
    const {
        formaFarmaceuticaAll,
        formaFarmaceuticaSubgrupoAll,
        tipoCapsulas,
        embalagens,
        excipientes,
        unidades,
    } = require('./constants');
    var orcamentos_edited = [];
    orcamentos.forEach(orcamento => {
        const formaFarmaceutica = orcamento['formaFarmaceutica'];
        const formaFarmaceuticaSubgrupo = orcamento['formaFarmaceuticaSubgrupo'];
        const embalagemNome = orcamento['embalagem']['nome'];
        const excipienteNome = orcamento['excipiente']['nome'];
        const ativos = orcamento['ativos'];
        const embalagem = orcamento['embalagem'];
        const excipiente = orcamento['excipiente'];
        const capsula = orcamento['capsula'];

        var formaFarmaceuticaAllEdited = [... new Set([formaFarmaceutica].concat(formaFarmaceuticaAll))];

        var formaFarmaceuticaSubgrupoAllEdited = formaFarmaceuticaSubgrupoAll;
        if (formaFarmaceuticaSubgrupoAllEdited[formaFarmaceutica].includes(formaFarmaceuticaSubgrupo)) {
            formaFarmaceuticaSubgrupoAllEdited[formaFarmaceutica] = [... new Set([formaFarmaceuticaSubgrupo].concat(formaFarmaceuticaSubgrupoAllEdited[formaFarmaceutica]))];
        }

        var embalagensEdited = [embalagemNome].concat(... new Set(embalagens));
        for (let i = 1; i < embalagensEdited.length; i++) {
            if (embalagemNome == embalagensEdited[i]) {
                embalagensEdited.splice(i, 1);
            }
        }

        var excipientesEdited = [excipienteNome].concat(... new Set(excipientes));
        for (let i = 1; i < excipientesEdited.length; i++) {
            if (excipienteNome == excipientesEdited[i]) {
                excipientesEdited.splice(i, 1);
            }
        }

        var unidadesEdited = {
            'embalagem': [... new Set([embalagem.unidade].concat(unidades))],
            'excipiente': [... new Set([excipiente.unidade].concat(unidades))],
            'capsula': [... new Set([capsula.unidade].concat(unidades))],
            'ativos': [],
        }
        for (let i = 0; i < ativos.length; i++) {
            unidadesEdited['ativos'] = unidadesEdited['ativos'].concat([[... new Set([ativos[i].unidade].concat(unidades))]]);
        }
        orcamentos_edited.push({
            nomeCliente: orcamento['nomeCliente'],
            nomeMedico: orcamento['nomeMedico'],
            dosagem: orcamento['dosagem'],
            formaFarmaceuticaAll: formaFarmaceuticaAllEdited,
            formaFarmaceuticaSubgrupoAll: formaFarmaceuticaSubgrupoAllEdited,
            tipoCapsulas: tipoCapsulas,
            embalagens: embalagensEdited,
            excipientes: excipientesEdited,
            unidades: unidadesEdited,
            formaFarmaceutica: formaFarmaceutica,
            formaFarmaceuticaSubgrupo: formaFarmaceuticaSubgrupo,
            ativos: ativos,
            embalagem: embalagem,
            excipiente: excipiente,
            capsula: capsula,
            custoFixo: orcamento['custoFixo'],
        });
    });

    return { "orcamentos_edited": orcamentos_edited };
}

app.post("/orcamento/edit", (req, res) => {
    const orcamento = JSON.parse(req.body['orcamento']);
    orcamento_edit = formatOrcamentoEdited(orcamento);
    
    res.render("orcamento_edit.ejs", orcamento_edit);
})

app.post('/orcamento/result', (req, res) => {
    const editted_orcamento = JSON.parse(req.body['submited_orcamento']);

    res.render("orcamento.ejs", editted_orcamento);
})

app.listen(port,"127.0.0.1", () => {
    console.log(`Server started on port ${port}`);
})
