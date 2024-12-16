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

function parse_orcamento_editted() {
    var orcamentos = []
    const tables = document.querySelectorAll("div[id^='orcamento-']")
    tables.forEach((table) => {
        var ativos = [];
        var embalagem = {};
        var excipiente = {};
        var capsula = {}
        const rows = table.querySelectorAll("table tbody tr");
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
                        ativo['quantidade'] = parseFloat(td.value.replace('.', '').replace(',', '.'));
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
                        embalagem['quantidade'] = parseFloat(td.value.replace(',', '.'));
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
                        excipiente['quantidade'] = td.value;
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
                        capsula['quantidade'] = parseFloat(td.innerText.replace(',', '.'));
                    }
                });
            }
        });

        orcamentos.push({
            "nome_cliente": document.getElementById('nome-cliente').value,
            "nome_medico": document.getElementById('nome-medico').value,
            "dosagem": parseFloat(document.getElementById('quantidade-orcamento').value.replace(',', '.')),
            "forma_farmaceutica": document.getElementById('forma-farmaceutica').value,
            "sub_forma_farmaceutica": document.getElementById('forma-farmaceutica-subgrupo').value,
            "ativos": ativos,
            "embalagem": embalagem,
            "excipiente": excipiente,
            "capsula": capsula,
        });
    });
    return orcamentos;
}

document.getElementById('submit_orcamento').addEventListener('click', async () => {
    sessionStorage.setItem('ativos', ativosOrcamento);

    orcamentos = parse_orcamento_editted();
    
    // Create a form for POST redirection
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/orcamento/result';

    // Add the processed data as a hidden input
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'orcamentos';
    input.value = JSON.stringify(orcamentos);
    form.appendChild(input);

    // Append the form to the body and submit it
    document.body.appendChild(form);
    form.submit();
});
