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

    document.getElementById('preco-capsula').innerText = `R$${capsulaPrice.toFixed(2)}`;
}

function parse_orcamento_editted() {
    var ativos = [];
    var embalagem = {};
    var excipiente = {};
    var capsula = {}
    const rows = document.querySelectorAll("table tbody tr");
    rows.forEach((tr) => {
        var ativo = {};
        var tds = tr.querySelectorAll('td');
        if (tr.id == 'ativo') {
            tds.forEach((td) => {
                if (td.querySelector('select')) {
                    td = td.querySelector('select');
                }
                else if (td.querySelector('input')) {
                    td = td.querySelector('input');
                }
                if (td.id.includes('ativoPuro')) {
                    ativo['nome'] = td.value == 'Selecione' ? '' : td.value;
                }
                else if (td.id.includes('ativo-unidade')) {
                    ativo['unidade'] = td.value;
                }
                else if (td.id.includes('ativo-quantidade')) {
                    ativo['quantidade'] = parseInt(td.value);
                }
            });
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
                    embalagem['nome'] = td.value;
                }
                else if (td.id.includes('embalagem-unidade')) {
                    embalagem['unidade'] = td.value;
                }
                else if (td.id.includes('embalagem-quantidade')) {
                    embalagem['quantidade'] = parseInt(td.value);
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
                    excipiente['nome'] = td.value;
                }
                else if (td.id.includes('excipiente-unidade')) {
                    excipiente['unidade'] = td.value;
                }
                else if (td.id.includes('excipiente-quantidade')) {
                    excipiente['quantidade'] = parseInt(td.value);
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
                    capsula['tipo'] = td.value;
                }
                else if (td.id.includes('capsula-unidade')) {
                    capsula['unidade'] = td.value;
                }
                else if (td.id.includes('capsula-quantidade')) {
                    capsula['quantidade'] = parseInt(td.value);
                }
            });
        }
    });
    return {
        "nome_cliente": document.getElementById('nome_cliente').value,
        "nome_medico": document.getElementById('nome_medico').value,
        "dosagem": parseInt(document.getElementById('quantidade-orcamento').value),
        "forma_farmaceutica": document.getElementById('forma-farmaceutica').value,
        "sub_forma_farmaceutica": document.getElementById('forma-farmaceutica-subgrupo').value,
        "ativos": ativos,
        "embalagem": embalagem,
        "excipiente": excipiente,
        "capsula": capsula,
    };
}

document.getElementById('submit_orcamento').addEventListener('click', async () => {
    orcamento = parse_orcamento_editted();

    const response = await fetch("http://127.0.0.1:8000/update_orcamento", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orcamento),
    });
    if (response.ok) {
        const result = JSON.parse((await response.json())['body'])['result'];

        // Create a form for POST redirection
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/orcamento/result';

        // Add the processed data as a hidden input
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'submited_orcamento';
        input.value = JSON.stringify(result);
        form.appendChild(input);

        // Append the form to the body and submit it
        document.body.appendChild(form);
        form.submit();
    } else {
        alert('Failed to process data. Try again.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const orcamento = JSON.parse(sessionStorage.getItem('orcamento'));
});