const ativosAll = JSON.parse(sessionStorage.getItem('ativos'));

window.onload = () => {
    updateCapsulaTable();
};

function updateCapsulaTable() {
    capsula_tables = document.querySelectorAll('table[id^="capsula-table-"]');
    capsula_tables.forEach((table, index) => {
        if(table.id.match(/(\d+)/)[1] != '1') {
            table.remove();
            document.getElementById("excipiente-table-"+index).remove();
        }
    });
}

function updateCapsule(indexOrcamento) {
    orcamento_json = JSON.parse(orcamento);

    const capsuleName = document.getElementById("capsula-nome").value;
    const capsulePrice = document.getElementById("preco-capsula");
    let index = 0;
    for (; index < orcamento_json[indexOrcamento].capsulas.opcoes.length; index++) {
        if (orcamento_json[indexOrcamento].capsulas.opcoes[index].nome == capsuleName) {
            break;
        }
    }
    capsulePrice.innerText = `R$ ${formatNumber(orcamento_json[indexOrcamento].capsulas.opcoes[index].preco, true)}`;
    updateTotalPrice(indexOrcamento, index);
}

function updateTotalPrice(indexOrcamento, index) {
    orcamento_json = JSON.parse(orcamento);
    const totalCell = document.getElementById("total-preco-"+indexOrcamento);
    totalCell.innerText = `R$ ${formatNumber(orcamento_json[indexOrcamento].precoTotal[index], true)}`;
}

function parse_orcamento() {
    var orcamentos = []
    var orcamentoCounter = 0;
    const tables = document.querySelectorAll("div[id^='orcamento-']")
    tables.forEach((table) => {
        var ativos = [];
        var embalagem = {};
        var excipiente = {};
        var capsula = {}
        var ativoCounter = 0;
        const rows = table.querySelectorAll("table tbody tr");
        rows.forEach((tr) => {
            var ativo = {};
            var tds = tr.querySelectorAll('td');
            if (tr.id == 'ativo') {
                tds.forEach((td) => {
                    if (td.id.includes('ativo-puro-')) {
                        ativo['opcoes'] = [
                            {
                                'nome': td.innerText,
                                'preco': 0.0
                            }
                        ];
                        for (let i = 0; i < ativosAll[orcamentoCounter][ativoCounter].length; i++) {
                            var element = ativosAll[orcamentoCounter][ativoCounter][i];
                            if (element.nome != '') {
                                ativo['opcoes'].push(element);
                            }
                        }
                        ativo['original'] = td.getAttribute('name');
                        ativoCounter += 1;
                    }
                    else if (td.id.includes('ativo-unidade')) {
                        ativo['unidade'] = td.innerText;
                    }
                    else if (td.id.includes('ativo-quantidade')) {
                        ativo['quantidade'] = parseFloat(td.innerText.replace('.', '').replace(',', '.'));
                    }
                });
                ativo['opcoes'] = ativo['opcoes'].filter((item, index, self) =>
                    index === self.findIndex((t) => t.nome === item.nome && t.preço === item.preço)
                );
                ativos = ativos.concat(ativo);
            }
            else if (tr.id == 'embalagem') {
                tds.forEach((td) => {
                    if (td.querySelector('select')) {
                        td = td.querySelector('select');
                    }
                    else if (td.querySelector('input')) {
                        td = td.querySelector('input');
                    }
                    if (td.id.includes('embalagem-nome')) {
                        embalagem['nome'] = td.innerText;
                    }
                    else if (td.id.includes('embalagem-quantidade')) {
                        embalagem['quantidade'] = parseFloat(td.innerText.replace('.', '').replace(',', '.'));
                    }
                    else if (td.id.includes('preco-embalagem')) {
                        embalagem['preco'] = parseFloat(td.innerText.replace("R$", "").replace('.', '').replace(',', '.'));
                    }
                });
            }
            else if (tr.id == 'excipiente') {
                tds.forEach((td) => {
                    if (td.querySelector('select')) {
                        td = td.querySelector('select');
                    }
                    else if (td.querySelector('input')) {
                        td = td.querySelector('input');
                    }
                    if (td.id.includes('excipiente-nome')) {
                        excipiente['nome'] = td.innerText;
                    }
                    else if (td.id.includes('excipiente-unidade')) {
                        excipiente['unidade'] = td.innerText;
                    }
                    else if (td.id.includes('excipiente-quantidade')) {
                        excipiente['quantidade'] = parseFloat(td.innerText.replace('.', '').replace(',', '.'));
                    }
                    else if (td.id.includes('preco-excipiente')) {
                        excipiente['preco'] = parseFloat(td.innerText.replace("R$", "").replace('.', '').replace(',', '.'));
                    }
                });
            }
            else if (tr.id == 'capsula') {
                tds.forEach((td) => {
                    if (td.querySelector('select')) {
                        td = td.querySelector('select');
                    }
                    else if (td.querySelector('input')) {
                        td = td.querySelector('input');
                    }
                    if (td.id.includes('capsula-tipo')) {
                        capsula['tipo'] = td.innerText;
                    }
                    else if (td.id.includes('capsula-nome')) {
                        capsula['nome'] = td.value;
                    }
                    else if (td.id.includes('capsula-contem')) {
                        capsula['contem'] = td.innerText;
                    }
                    else if (td.id.includes('capsula-unidade')) {
                        capsula['unidade'] = td.innerText;
                    }
                    else if (td.id.includes('capsula-quantidade')) {
                        capsula['quantidade'] = parseFloat(td.innerText.replace('.', '').replace(',', '.'));
                    }
                    else if (td.id.includes('preco-capsula')) {
                        capsula['preco'] = parseFloat(td.innerText.replace("R$", "").replace('.', '').replace(',', '.'));
                    }
                });
            }
        });
        var orcamento = {
            "nomeCliente": document.getElementById('nome-cliente').value,
            "nomeMedico": document.getElementById('nome-medico').value,
            "dosagem": parseFloat(table.querySelector('span[id="quantidade-orcamento"]').innerText.replace('.', '').replace(',', '.')),
            "custoFixo": parseFloat(table.querySelector('span[id="preco-custo-fixo"]').innerText.replace("R$", "").replace('.', '').replace(',', '.')),
            "formaFarmaceutica": table.querySelector('span[id="forma-farmaceutica"]').innerText,
            "formaFarmaceuticaSubgrupo": table.querySelector('span[id="forma-farmaceutica-subgrupo"]').innerText,
            "ativos": ativos,
            "embalagem": embalagem,
            "excipiente": excipiente,
            "capsula": capsula,
            "nomeFormula": table.querySelector('h2[id="nome-formula"]').innerText,
        };
        orcamentos.push(orcamento);
        orcamentoCounter += 1;
    });

    return orcamentos;
}

document.getElementById('edit_orcamento').addEventListener('click', async () => {
    const orcamento = JSON.stringify(parse_orcamento());
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/orcamento/edit';

    const orcamentoInput = document.createElement('input');
    orcamentoInput.type = 'hidden';
    orcamentoInput.name = 'orcamento';
    orcamentoInput.value = orcamento;
    form.appendChild(orcamentoInput);

    document.body.appendChild(form);
    form.submit();
});

// document.getElementById('save_orcamento').addEventListener('click', async () => {
//     var content = document.getElementById("orcamento-page");
//     print(content);
    // const { jsPDF } = window.jspdf;
    // var doc = new jsPDF();

    // let content = document.getElementById("orcamento-page");
    // content.querySelector("img[id='logo-essential']").remove();
    // content.querySelector("div[class='button-container']").remove();
    // content.querySelector("div[class='button-container']").remove();
    // doc.html(
    //     content,
    //     {
    //         callback: function (doc) {
    //             doc.save("orcamento.pdf");
    //         },
    //         x: 0,
    //         y: 0,
    //         html2canvas: {
    //             scale: 0.15,
    //         },
    //     },
    // );
    
// });