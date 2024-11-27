const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const http = require('http');
const https = require('https');
const md5 = require("md5");
const session = require('express-session');

var app = express();
const port = 8080;

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
    var loading_status = "Fazendo upload do arquivo... (1/3)";
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
    while (connected) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Looking for file: " + directory + filename + curr_ext);
        if (fs.existsSync(directory + filename + curr_ext)) {
            console.log('Progress ... ', directory + filename + curr_ext);
            if (curr_ext == ".txt") {
                curr_ext = ".json";
                directory = __dirname + "/processed/";
                loading_status = "Identificando medicamentos... (3/3)";
                loading_code = 2;
            }
            else if (curr_ext == ".json") {
                loading_status = "Processo finalizado!";
                loading_code = 3;
            } else {
                curr_ext = ".txt";
                directory = __dirname + "/scans/";
                loading_status = "Analisando texto... (2/3)";
                loading_code = 1;
            }
        }
        res.write(`data: {"status_text": "${loading_status}", "status_code": ${loading_code}}\n\n`);
    }

})

app.get("/orcamento", function (req, res, next) {
    var pdf_path = path.join(__dirname + "/uploads/", req.query.filename);
    console.log("check existing file " + pdf_path);
    do {
        console.log("waiting for file " + pdf_path);
    } while (!fs.existsSync(pdf_path))
    // Make request to local api to convert pdf to text and extract content
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
    var r = http.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);
        res.setEncoding('utf8');
        res.on('data', (d) => {
            console.log(d);
        });
    });

    r.on('error', (error) => {
        console.error(error);
    });

    r.write(content);

    r.end();
    var json_path = path.join(__dirname + "/processed/", req.query.filename.split('.')[0] + ".json");
    console.log("check existing file " + json_path);
    do {
    } while (!fs.existsSync(json_path))
    res.render("orcamento.ejs", {})
})

app.get("/orcamento", async function (req, res, next) {
    var json_path = path.join(__dirname + "/processed/", req.query.filename.split('.')[0] + ".json");
    console.log("check existing file " + json_path);
    do {
    } while (!fs.existsSync(json_path))
    var content = fs.readFileSync(json_path);
    var data = JSON.parse(content);
    console.log(data);
    res.render("orcamento.ejs", {
        nomeCliente: 'Maria',
        quantidade: 60,
        nomeMedico: 'João',
        formaFarmaceutica: '1 - Cápsula',
        formaFarmaceuticaSubgrupo: 'Slow Release',
        ativos: [
            {
                'unidade': 'MG',
                'quantidade': 200,
                'opcoes': [
                    {
                        'nome': '',
                        'preco': '-'
                    },
                    {
                        'nome': 'FENUGREEK (50% FENUSIDEOS)',
                        'preco': 47.85
                    }
                ]
            },
            {
                'unidade': 'MG',
                'quantidade': 500,
                'opcoes': [
                    {
                        'nome': '',
                        'preco': '-'
                    },
                    {
                        'nome': 'MACA',
                        'preco': 36.88
                    },
                    {
                        'nome': 'VINAGRE MACA',
                        'preco': 36.84
                    }
                ]
            },
            {
                'unidade': 'MG',
                'quantidade': 100,
                'opcoes': [
                    {
                        'nome': '',
                        'preco': '-'
                    },
                    {
                        'nome': 'GINKGO BILOBA EXTRACT 2:1',
                        'preco': 7.55
                    },
                    {
                        'nome': 'EXT GLICOL GINKGO BILOBA',
                        'preco': 2.66
                    }
                ]
            }
        ],
        embalagem: {
            'nome': 'POTE CAPS 310ML',
            'unidade': 'MG',
            'quantidade': 1,
            'preco': 21.88,
        },
        excipiente: {
            'nome': 'EXCIPIENTE PADRÃO CÁPSULAS',
            'unidade': 'MG',
            'quantidade': 173.79,
            'preco': 2.60,
        },
        capsulas: [
            {
                'quantidade': 60,
                'unidade': 'UN',
                'tipo': 'INCOLOR',
                'nome': 'CAP INCOLOR 0',
                'contem': 3,
                'preco': 30.15
            },
        ],
        custoFixo: 7.80,
        total: 494.10,
        parseError: false,
    });
})

app.post("/orcamento/edit", (req, res) => {
    const {
        formaFarmaceuticaAll,
        formaFarmaceuticaSubgrupoAll,
        tipoCapsulas,
        embalagens,
        excipientes,
        unidades,
    } = require('./constants');
    const orcamento = JSON.parse(req.body['orcamento']);
    const formaFarmaceutica = '1 - Cápsula';
    const formaFarmaceuticaSubgrupo = 'Slow Release';
    const embalagemNome = 'POTE CAPS 310ML';
    const excipienteNome = 'EXCIPIENTE PADRÃO CÁPSULAS';
    const ativos = orcamento['ativos'];
    const embalagem = orcamento['embalagem'];
    const excipiente = orcamento['excipiente'];
    const capsula = orcamento['capsula'];

    var formaFarmaceuticaAllEdited = [formaFarmaceutica].concat(formaFarmaceuticaAll);
    for (let i = 1; i < formaFarmaceuticaAllEdited.length; i++) {
        if (formaFarmaceutica == formaFarmaceuticaAllEdited[i]) {
            formaFarmaceuticaAllEdited.splice(i, 1);
        }
    }

    var formaFarmaceuticaSubgrupoAllEdited = formaFarmaceuticaSubgrupoAll;
    if (formaFarmaceuticaSubgrupoAllEdited[formaFarmaceutica].includes(formaFarmaceuticaSubgrupo)) {
        var idx = formaFarmaceuticaSubgrupoAllEdited[formaFarmaceutica].indexOf(formaFarmaceuticaSubgrupo);
        formaFarmaceuticaSubgrupoAllEdited[formaFarmaceutica].splice(idx, 1);
        formaFarmaceuticaSubgrupoAllEdited[formaFarmaceutica] = [formaFarmaceuticaSubgrupo].concat(formaFarmaceuticaSubgrupoAllEdited[formaFarmaceutica]);
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
    const orcamento_edit = {
        nomeCliente: 'Maria',
        nomeMedico: 'João',
        quantidade: 60,
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
        custoFixo: 7.80,
        total: 494.10,
        parseError: false,
    };
    res.render("orcamento_edit.ejs", orcamento_edit);
})

app.post('/orcamento/result', (req, res) => {
    const editted_orcamento = JSON.parse(req.body['submited_orcamento']);
    
    res.render("orcamento.ejs", editted_orcamento);
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})

//  https.createServer(
//      {
//          key: fs.readFileSync('/etc/letsencrypt/live/quoter-mvp.anaai.com.br/privkey.pem'),
//          cert: fs.readFileSync('/etc/letsencrypt/live/quoter-mvp.anaai.com.br/cert.pem'),
//          ca: fs.readFileSync('/etc/letsencrypt/live/quoter-mvp.anaai.com.br/chain.pem'),
//      },
//      app
//  ).listen(443, () => {
//      console.log("Server running also on 443")
//  })
