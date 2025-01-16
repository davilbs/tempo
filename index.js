const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const http = require('http');
const https = require('https');
const md5 = require("md5");
const session = require('express-session');
const { formatNumber } = require('./public/scripts/utils');

var app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        console.log("Got filename salt", req.session.salt)
        cb(null, md5(file.originalname) + path.extname(file.originalname))
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
    res.render("index.ejs", { parseError: false });
})

async function extractPrescription(pdf_path) {
    var content = JSON.stringify({ "filename": pdf_path });
    var options = {
        hostname: 'localhost',
        port: 8001,
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

app.post("/calculate", upload.single("prescription"), (req, res, next) => {
    const file = req.file;
    if (!file) {
        const error = new Error('Please upload a file')
        error.httpStatusCode = 400
        return next(error)
    }

    var json_path = path.join(__dirname + "/processed/", req.file.filename.split('.')[0] + ".json");
    if (fs.existsSync(json_path)) {
        console.log("Found json file")
        var content = fs.readFileSync(json_path);
        var orcamento = JSON.parse(content);
        orcamentos_edited = formatOrcamentoEdited(orcamento);
        res.render("orcamento_edit.ejs", { orcamentos_edited, orcamento, formatNumber });
        return;
    }

    var pdf_path = path.join(__dirname + "/uploads/", req.file.filename);
    do {
        console.log("Checking for file " + pdf_path);
    } while (!fs.existsSync(pdf_path))

    extractPrescription(pdf_path)
        .then(function (body) {
            // Wait for the file to be processed
            console.log("File processed");
        })
        .catch((err) => {
            console.log("Error");
        });

    res.sendStatus(204);
});

app.get('/events', async function (req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    var loading_status = "Fazendo upload do arquivo... (1/2)";
    var loading_code = 1;
    let filename = md5(req.query.filename);
    let curr_ext = path.extname(req.query.filename);
    let directory = __dirname + "/uploads/";

    let counter = 0;
    res.write(`data: {"status_text": "${loading_status}", "status_code": ${loading_code}}\n\n`);
    let interValID = setInterval(() => {
        if (fs.existsSync(directory + filename + curr_ext)) {
            console.log("Found file: " + directory + filename + curr_ext);
            if (curr_ext == ".json") {
                loading_status = "Processo finalizado!";
                loading_code = 3;
                res.write(`data: {"status_text": "${loading_status}", "status_code": ${loading_code}}\n\n`);
            }
            else {
                curr_ext = ".json";
                directory = __dirname + "/processed/";
                loading_status = "Analisando receita... (2/2)";
                loading_code = 2;
                counter = 0;
                res.write(`data: {"status_text": "${loading_status}", "status_code": ${loading_code}}\n\n`);
            }
        } else{
            counter++;
            if (counter >= 60) {
                res.write(`data: {"status_text": "${loading_status}", "status_code": -1}\n\n`);
                clearInterval(interValID);
                res.end();
                return;
            } 
            else if (counter >= 50) {
                res.write(`data: {"status_text": "Finalizando processamento ... Aguarde um momento", "status_code": ${loading_code}}\n\n`);
            }
            else if (counter >= 45) {
                res.write(`data: {"status_text": "Buscando informações adicionais ... Aguarde um momento", "status_code": ${loading_code}}\n\n`);
            }
            else if (counter >= 35) {
                res.write(`data: {"status_text": "Identificando ativos... Aguarde um momento", "status_code": ${loading_code}}\n\n`);
            }
            else if (counter >= 20) {
                res.write(`data: {"status_text": "Ajustando valores ... Aguarde um momento", "status_code": ${loading_code}}\n\n`);
            }
            else if (counter >= 10) {
                res.write(`data: {"status_text": "Identificando medicamentos... Aguarde um momento", "status_code": ${loading_code}}\n\n`);
            }
        }
    }, 2000);

    req.on('close', () => {
        console.log("Connection closed by client");
        clearInterval(interValID);
        res.end();
    });
})

app.get("/orcamento", function (req, res, next) {
    let filename = md5(req.query.filename);
    var json_path = path.join(__dirname + "/processed/", filename + ".json");

    try {
        var content = fs.readFileSync(json_path);
        var orcamento = JSON.parse(content);
        
        // Render the page with the data 
        orcamentos_edited = formatOrcamentoEdited(orcamento);
        res.render("orcamento_edit.ejs", { orcamentos_edited, orcamento, formatNumber });
    } catch (error) {
        // Return to the index page
        console.log("Error reading file", error);
        res.render("index.ejs", { parseError: true });
    }

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
    for (let i = 0; i < orcamentos.length; i++) {
        const orcamento = orcamentos[i];
        var formaFarmaceutica = orcamento['formaFarmaceutica'];
        var formaFarmaceuticaSubgrupo = orcamento['formaFarmaceuticaSubgrupo'];
        var embalagemNome = orcamento['embalagem']['nome'];
        var excipienteNome = orcamento['excipiente']['nome'];
        var ativos = orcamento['ativos'];
        var embalagem = orcamento['embalagem'];
        var excipiente = orcamento['excipiente'];
        var capsula = orcamento['capsula'];
        var formaFarmaceuticaAllEdited = [... new Set([formaFarmaceutica].concat(formaFarmaceuticaAll))];

        var formaFarmaceuticaSubgrupoAllEdited = { ...formaFarmaceuticaSubgrupoAll };
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

        var tipoCapsulasEdited = [capsula.tipo != null ? capsula.tipo : ''].concat(... new Set(tipoCapsulas));
        for (let i = 1; i < tipoCapsulasEdited.length; i++) {
            if (capsula.tipo == tipoCapsulasEdited[i]) {
                tipoCapsulasEdited.splice(i, 1);
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
            tipoCapsulas: tipoCapsulasEdited,
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
            nomeFormula: orcamento['nomeFormula'],
        });
    };

    return { "orcamentos_edited": orcamentos_edited };
}

app.post("/orcamento/edit", (req, res) => {
    const orcamento = JSON.parse(req.body['orcamento']);
    orcamentos_edited = formatOrcamentoEdited(orcamento);

    res.render("orcamento_edit.ejs", { orcamentos_edited, orcamento , formatNumber });
})

app.post('/orcamento/result', (req, res) => {
    var content = req.body.orcamentos;
    var options = {
        hostname: 'localhost',
        port: 8001,
        path: "/update_orcamento",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(content)
        }
    };
    var request = new Promise(function (resolve, reject) {
        let r = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', (data) => {
                resolve(data);
            });
            if (res.statusCode != 200) {
                console.log("Got ERROR");
                reject(res.err);
            }
        });
        r.write(content);
        r.end();
    });
    request.then(function (body) {
        var orcamentos_edited = JSON.parse(body)['result'];
        orcamentos_edited = { "orcamentos_edited": orcamentos_edited };
        res.render("orcamento.ejs", { orcamentos_edited, formatNumber });
    })
        .catch((err) => {
            console.log("Error");
            res.render("index.ejs", { parseError: true });
        });
})

app.post('/orcamento/adjust', (req, res) => {
    var content = req.body.orcamentos;

    var options = {
        hostname: 'localhost',
        port: 8001,
        path: "/adjust_orcamento",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(content)
        }
    };
    
    var request = new Promise(function (resolve, reject) {
        let r = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', (data) => {
                resolve(data);
            });
            if (res.statusCode != 200) {
                console.log("Got ERROR");
                reject(res.err);
            }
        });
        r.write(content);
        r.end();
    });
    request.then(function (body) {
        const orcamento = JSON.parse(body)['result'];
        orcamentos_edited = formatOrcamentoEdited(orcamento);
        
        res.render("orcamento_edit.ejs", { orcamentos_edited, orcamento , formatNumber });
    })
        .catch((err) => {
            console.log("Error");
            res.render("index.ejs", { parseError: true });
        });
})

app.listen(port, "127.0.0.1", () => {
    console.log(`Server started on port ${port}`);
})
