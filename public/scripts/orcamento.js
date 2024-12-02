window.onload = () => {
    updateTotal();
};

function handleAtivoChange(rowIndex) {
    // Get the dropdown for the current row
    const selectElement = document.getElementById(`ativoPuro-${rowIndex}`);
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    // Extract the price from the selected option
    const preco = selectedOption.getAttribute('data-preco');

    // Update the corresponding Preço cell
    document.getElementById(`preco-ativo-${rowIndex}`).innerText =
        preco !== '-' ? `R$${parseFloat(preco).toFixed(2)}` : preco;

    updateTotal();
}

function updateTotal() {
    let total = 0;

    // Loop through all rows to calculate the sum of selected prices
    const rows = document.querySelectorAll("table tbody tr");
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
    const totalCell = document.getElementById("total-preco");
    totalCell.innerText = `R$${total.toFixed(2)}`;
}

function updateSubgrupoDropdown() {
    const formaFarmaceutica = document.getElementById('forma-farmaceutica').value;
    const subgrupoDropdown = document.getElementById('forma-farmaceutica-subgrupo');

    subgrupoDropdown.innerHTML = '';

    const subgrupoOptions = formaFarmaceuticaSubgrupoAll[formaFarmaceutica];
    subgrupoOptions.forEach((subgrupo, index) => {
        const option = document.createElement('option');
        option.value = subgrupo;
        option.textContent = subgrupo;
        if (index === 0) {
            option.selected = true;
        }
        subgrupoDropdown.appendChild(option);
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
    var ativos = [];
    var embalagem = {};
    var excipiente = {};
    var capsula = {}
    const rows = document.querySelectorAll("table tbody tr");
    var ativoCounter = 0;
    const ativosAll = JSON.parse(ativosList);
    rows.forEach((tr) => {
        var ativo = {};
        var tds = tr.querySelectorAll('td');
        console.log("Loading tr", tr.id);
        if (tr.id == 'ativo') {
            tds.forEach((td) => {
                if (td.querySelector('select')) {
                    td = td.querySelector('select');
                    const values = Array.from(td.options).map(option => option.value);
                    ativo['opcoes'] = [];
                    for (let i = 0; i < values.length; i++) {
                        var element = values[i];
                        var price = ativosAll[ativoCounter].opcoes[i]['preco'];
                        ativo['opcoes'].push(
                            {
                                'nome': element,
                                'preco': price
                            }
                        );
                    }
                }
                else if (td.id.includes('ativo-unidade')) {
                    ativo['unidade'] = td.innerText;
                }
                else if (td.id.includes('ativo-quantidade')) {
                    ativo['quantidade'] = parseInt(td.innerText);
                }
            });
            ativos = ativos.concat(ativo);
            ativoCounter += 1;
        }
        else if (tr.id == 'embalagem') {
            tds.forEach((td) => {
                if (td.querySelector('select')) {
                    td = td.querySelector('select');
                }
                else if (td.querySelector('input')) {
                    td = td.querySelector('input');
                }
                console.log("EMBALAGEM", td);
                if (td.id.includes('embalagem-nome')) {
                    embalagem['nome'] = td.innerText;
                }
                else if (td.id.includes('embalagem-unidade')) {
                    embalagem['unidade'] = td.innerText;
                }
                else if (td.id.includes('embalagem-quantidade')) {
                    embalagem['quantidade'] = parseInt(td.innerText);
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
                    excipiente['quantidade'] = parseInt(td.innerText);
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
                    capsula['quantidade'] = parseInt(td.innerText);
                }
                else if (td.id.includes('preco-capsula')) {
                    capsula['preco'] = parseFloat(td.innerText.replace("R$", ""));
                }
            });
        }
    });
    return {
        "nomeCliente": document.getElementById('nome-cliente').innerText,
        "nomeMedico": document.getElementById('nome-medico').innerText,
        "custoFixo": parseInt(document.getElementById('quantidade-orcamento').innerText),
        "formaFarmaceutica": document.getElementById('forma-farmaceutica').innerText,
        "formaFarmaceuticaSubgrupo": document.getElementById('forma-farmaceutica-subgrupo').innerText,
        "ativos": ativos,
        "embalagem": embalagem,
        "excipiente": excipiente,
        "capsula": capsula,
    };
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