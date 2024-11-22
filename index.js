const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const https = require('https');
const md5 = require("md5");
const session = require('express-session');

var app = express();
const port = 80;

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
    res.redirect("/results?filename=" + req.file.filename);
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

app.get("/results", async function (req, res, next) {
    var resultPath = path.join(__dirname + "/processed/", req.query.filename.split('.')[0] + ".json");
    console.log("check existing json " + resultPath);
    if (fs.existsSync(resultPath)) {
        console.log("Caminho encontrado");
        let json_name = req.query.filename.split('.')[0] + ".json";
        let txt_name = req.query.filename.split('.')[0] + ".txt";
        console.log(json_name)
        const calculatebudget = spawn('python', [__dirname + '/scripts/calculatebudget.py', json_name]);

        let budget_output = "";
        calculatebudget.stdout.on("data", (data) => {
            budget_output += data.toString();

        });
        calculatebudget.on("error", (err) => {
            console.log(err);
            res.render("index.ejs", { parseError: true });
        })
        calculatebudget.on("close", () => {
            console.log(budget_output)
            try {
                let document = __dirname + "/scans/" + txt_name
                console.log(document)
                let inText = fs.readFileSync(document)
                res.render("resultado.ejs", { items: JSON.parse(budget_output).items, scanText: inText.toString().replace(/(?:\r\n|\r|\n)/g, '<br/>') });
            } catch (err) {
                console.log(err)
                res.render("index.ejs", { parseError: true });
            }
        })

    } else {
        const tikaocr = spawn('python', [__dirname + '/scripts/tikaocr.py', req.query.filename]);

        let ocr_output = "";
        tikaocr.stdout.on("data", (data) => {
            ocr_output += data.toString();
        });

        tikaocr.on("error", (err) => {
            console.log(err);
            res.render("index.ejs", { parseError: true });
        })

        tikaocr.on("close", () => {
            console.log(ocr_output);
            if (ocr_output != "fail.txt") {
                const llmanalyze = spawn('python', [__dirname + '/scripts/analyze.py', ocr_output]);
                let llm_output = "";
                llmanalyze.stdout.on("data", (data) => {
                    llm_output += data.toString();

                });

                llmanalyze.on("error", () => {
                    console.log(err);
                    res.render("index.ejs", { parseError: true });
                })

                llmanalyze.on("close", () => {
                    console.log(llm_output)
                    const calculatebudget = spawn('python', [__dirname + '/scripts/calculatebudget.py', llm_output]);

                    let budget_output = "";
                    calculatebudget.stdout.on("data", (data) => {
                        budget_output += data.toString();

                    });

                    calculatebudget.on("error", (err) => {
                        console.log(err);
                        res.render("index.ejs", { parseError: true });
                    })

                    calculatebudget.on("close", () => {
                        console.log(budget_output)
                        try {
                            let document = __dirname + "/scans/" + ocr_output
                            console.log(document)
                            let inText = fs.readFileSync(document)
                            res.render("resultado.ejs", { items: JSON.parse(budget_output).items, scanText: inText.toString().replace(/(?:\r\n|\r|\n)/g, '<br/>') });
                        } catch (err) {
                            console.log(err)
                            res.render("index.ejs", { parseError: true });
                        }
                    })
                });
            }
        });

    }
})

app.get("/orcamento", async function (req, res, next) {
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
        capsula: {
            'quantidade': 60,
            'unidade': 'UN',
            'tipo': 'INCOLOR',
            'nome': 'CAP INCOLOR 0',
            'contem': 3,
            'preco': 30.15
        },
        custoFixo: 7.80,
        total: 494.10,
        parseError: false,
    });
})

app.get("/orcamento/edit", (req, res) => {
    const {
        formaFarmaceuticaAll,
        formaFarmaceuticaSubgrupoAll,
        tipoCapsulas,
        embalagens,
        excipientes,
        unidades,
    } = require('./constants');
    const formaFarmaceutica = '1 - Cápsula';
    const formaFarmaceuticaSubgrupo = 'Slow Release';
    const embalagemNome = 'POTE CAPS 310ML';
    const excipienteNome = 'EXCIPIENTE PADRÃO CÁPSULAS';
    const ativos = [
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
    ];
    const embalagem= {
        'nome': 'POTE CAPS 310ML',
        'unidade': 'MG',
        'quantidade': 1,
        'preco': 21.88,
    };
    const excipiente = {
        'nome': 'EXCIPIENTE PADRÃO CÁPSULAS',
        'unidade': 'MG',
        'quantidade': 173.79,
        'preco': 2.60,
    };
    const capsula = {
        'quantidade': 60,
        'unidade': 'UN',
        'tipo': 'INCOLOR',
        'nome': 'CAP INCOLOR 0',
        'contem': 3,
        'preco': 30.15
    };

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
    
    res.render("orcamento_edit.ejs", {
        formaFarmaceuticaAll: formaFarmaceuticaAllEdited,
        formaFarmaceuticaSubgrupoAll: formaFarmaceuticaSubgrupoAllEdited,
        tipoCapsulas: tipoCapsulas,
        embalagens: embalagensEdited,
        excipientes: excipientesEdited,
        unidades: unidadesEdited,
        nomeCliente: 'Maria',
        quantidade: 60,
        nomeMedico: 'João',
        formaFarmaceutica: formaFarmaceutica,
        formaFarmaceuticaSubgrupo: formaFarmaceuticaSubgrupo,
        ativos: ativos,
        embalagem: embalagem,
        excipiente: excipiente,
        capsula: capsula,
        custoFixo: 7.80,
        total: 494.10,
        parseError: false,
    });
})

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
