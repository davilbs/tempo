const ativosAll = JSON.parse(sessionStorage.getItem('ativos'));

window.onload = () => {
    updateTotal();
};

function updateTotal() {
    const tables = document.querySelectorAll("div[id^='orcamento-']")
    tables.forEach((table) => {
        let total = 0;
        // Loop through all rows to calculate the sum of selected prices
        const rows = table.querySelectorAll("table tbody tr");
        rows.forEach((row, index) => {
            var tds = row.querySelectorAll('td');

            if (tds[tds.length - 1].id.includes('preco-')) {
                const precoText = tds[tds.length - 1].innerText;

                if (precoText && precoText.startsWith("R$")) {
                    const preco = parseFloat(precoText.replace("R$", "").replace(",", "."));
                    if (!isNaN(preco)) {
                        total += preco;
                    }
                }
            }
        });

        // Update the Total cell
        const totalCell = table.querySelector("td[id='total-preco']");
        totalCell.innerText = `R$${total.toFixed(2)}`;
    });
}

function updateCapsulaDropdown() {
    const capsulaTipo = document.getElementById('capsula-tipo').value;
    const capsulaNome = document.getElementById('capsula-nome');
    if (capsulaNome.innerText == '-') {
        return;
    }
    capsulaNome.innerHTML = '';

    var subgrupoOptionsCapsule = ['-'];
    for (let i = 0; i < capsulas.opcoes.length; i++) {
        if (capsulas.opcoes[i].tipo == capsulaTipo) {
            subgrupoOptionsCapsule = capsulas.opcoes[i].tipo_opcoes;
            break;
        }
    }

    subgrupoOptionsCapsule.forEach((subgrupo, index) => {
        const option = document.createElement('option');
        option.value = subgrupo.nome;
        option.textContent = subgrupo.nome;
        if (index === 0) {
            option.selected = true;
        }
        capsulaNome.appendChild(option);
    });
    updateCapsulaContem();
}

function updateCapsulaContem() {
    const capsulaTipo = document.getElementById('capsula-tipo').value;
    const capsulaNome = document.getElementById('capsula-nome').value;

    var subgrupoOptionsCapsule = ['-'];
    var capsulaContem = '-';

    for (let i = 0; i < capsulas.opcoes.length; i++) {
        if (capsulas.opcoes[i].tipo == capsulaTipo) {
            subgrupoOptionsCapsule = capsulas.opcoes[i].tipo_opcoes;
            for (let j = 0; j < subgrupoOptionsCapsule.length; j++) {
                if (subgrupoOptionsCapsule[j].nome == capsulaNome) {
                    capsulaContem = subgrupoOptionsCapsule[j].contem;
                    break;
                }
            }
            break;
        }
    }

    document.getElementById('capsula-contem').innerText = capsulaContem;
    updateCapsulaPrice();
}

function updateCapsulaPrice() {
    const capsulaTipo = document.getElementById('capsula-tipo').value;
    const capsulaNome = document.getElementById('capsula-nome').value;

    var subgrupoOptionsCapsule = ['-'];
    var capsulaPrice = '-';

    for (let i = 0; i < capsulas.opcoes.length; i++) {
        if (capsulas.opcoes[i].tipo == capsulaTipo) {
            subgrupoOptionsCapsule = capsulas.opcoes[i].tipo_opcoes;
            for (let j = 0; j < subgrupoOptionsCapsule.length; j++) {
                if (subgrupoOptionsCapsule[j].nome == capsulaNome) {
                    capsulaPrice = subgrupoOptionsCapsule[j].preco;
                    break;
                }
            }
            break;
        }
    }

    document.getElementById('capsula-preco').innerText = `R$${capsulaPrice.toFixed(2)}`;
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
                            if (element.nome != ''){
                                ativo['opcoes'].push(element);
                            }
                        }
                        ativoCounter += 1;
                    }
                    else if (td.id.includes('ativo-unidade')) {
                        ativo['unidade'] = td.innerText;
                    }
                    else if (td.id.includes('ativo-quantidade')) {
                        ativo['quantidade'] = parseFloat(td.innerText);
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
                    else if (td.id.includes('embalagem-unidade')) {
                        embalagem['unidade'] = td.innerText;
                    }
                    else if (td.id.includes('embalagem-quantidade')) {
                        embalagem['quantidade'] = parseFloat(td.innerText);
                    }
                    else if (td.id.includes('preco-embalagem')) {
                        embalagem['preco'] = parseFloat(td.innerText.replace("R$", ""));
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
                        excipiente['quantidade'] = parseFloat(td.innerText);
                    }
                    else if (td.id.includes('preco-excipiente')) {
                        excipiente['preco'] = parseFloat(td.innerText.replace("R$", ""));
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
                        capsula['nome'] = td.innerText;
                    }
                    else if (td.id.includes('capsula-contem')) {
                        capsula['contem'] = td.innerText;
                    }
                    else if (td.id.includes('capsula-unidade')) {
                        capsula['unidade'] = td.innerText;
                    }
                    else if (td.id.includes('capsula-quantidade')) {
                        capsula['quantidade'] = parseFloat(td.innerText);
                    }
                    else if (td.id.includes('preco-capsula')) {
                        capsula['preco'] = parseFloat(td.innerText.replace("R$", ""));
                    }
                });
            }
        });
        orcamentos.push({
            "nomeCliente": document.getElementById('nome-cliente').innerText,
            "nomeMedico": document.getElementById('nome-medico').innerText,
            "dosagem": parseFloat(document.getElementById('quantidade-orcamento').innerText),
            "custoFixo": parseFloat(document.getElementById('preco-custo-fixo').innerText.replace("R$", "")),
            "formaFarmaceutica": document.getElementById('forma-farmaceutica').innerText,
            "formaFarmaceuticaSubgrupo": document.getElementById('forma-farmaceutica-subgrupo').innerText,
            "ativos": ativos,
            "embalagem": embalagem,
            "excipiente": excipiente,
            "capsula": capsula,
        });
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