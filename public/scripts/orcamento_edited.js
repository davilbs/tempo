function updateSubgrupoDropdown(indexOrcamento) {
    const formaFarmaceutica = document.getElementById('forma-farmaceutica-' + indexOrcamento).value;
    const subgrupoDropdown = document.getElementById('forma-farmaceutica-subgrupo-' + indexOrcamento);

    subgrupoDropdown.innerHTML = '';

    const subgrupoOptions = JSON.parse(formaFarmaceuticaSubgrupoAll)[formaFarmaceutica];
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
    var orcamento_index = 0;
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
            if (tr.id.includes('ativo')) {
                tds.forEach((td) => {
                    if (td.querySelector('select')) {
                        td = td.querySelector('select');
                    }
                    else if (td.querySelector('input')) {
                        td = td.querySelector('input');
                    }
                    if (td.id.includes('ativo-puro')) {
                        if (td.name != '<%= opcao.nome %>' && td.name != '') {
                            ativo['original'] = td.name;
                        }
                        ativo['nome'] = td.value;
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
            "dosagem": parseFloat(document.getElementById('quantidade-orcamento-' + orcamento_index).value.replace(',', '.')),
            "forma_farmaceutica": document.getElementById('forma-farmaceutica-' + orcamento_index).value,
            "sub_forma_farmaceutica": document.getElementById('forma-farmaceutica-subgrupo-' + orcamento_index).value,
            "ativos": ativos,
            "embalagem": embalagem,
            "excipiente": excipiente,
            "capsula": capsula,
            "nome_formula": table.querySelector('input[id="nome-formula-' + orcamento_index + '"]').value,
        });
        orcamento_index += 1;
    });
    return orcamentos;
}

document.getElementById('submit_orcamento').addEventListener('click', async () => {
    const ativosOrcamentos = JSON.parse(orcamentosEdited);
    var allAtivos = [];
    ativosOrcamentos.forEach((auxOrcamento) => {
        var ativos = [];
        auxOrcamento.ativos.forEach((ativo) => {
            ativos.push(ativo.opcoes);
        });
        allAtivos.push(ativos);
    });
    sessionStorage.setItem('ativos', JSON.stringify(allAtivos));

    orcamentos = parse_orcamento_editted();
    var orcamentoEdited = checkOrcamentoEdited();
    // Create a form for POST redirection
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = orcamentoEdited ? '/orcamento/adjust' : '/orcamento/result';

    // Add the processed data as a hidden input
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'orcamentos';
    input.value = JSON.stringify(orcamentos);
    form.appendChild(input);

    // Append the form to the body and submit it
    document.body.appendChild(form);
    sessionStorage.removeItem('orcamentoEditado');
    form.submit();
});

function checkOrcamentoEdited() {
    var orcamentoEditado = sessionStorage.getItem('orcamentoEditado');
    if (orcamentoEditado == null) {
        return false;
    } else {
        return true;
    }
}

function addCounterOrcamentoEdited() {
    var orcamentoEditado = sessionStorage.getItem('orcamentoEditado');
    if (orcamentoEditado == null) {
        sessionStorage.setItem('orcamentoEditado', 1);
    } else {
        sessionStorage.setItem('orcamentoEditado', (parseInt(orcamentoEditado) + 1));
    }
    orcamentoEditado = sessionStorage.getItem('orcamentoEditado');
}

function subCounterOrcamentoEdited() {
    var orcamentoEditado = sessionStorage.getItem('orcamentoEditado');
    if (orcamentoEditado == null) {
        return;
    } else if (orcamentoEditado == 1) {
        sessionStorage.removeItem('orcamentoEditado');
    } else if (orcamentoEditado > 1) {
        sessionStorage.setItem('orcamentoEditado', (parseInt(orcamentoEditado) - 1));
    }
}

function addFormula() {
    const tableFormula = document.querySelectorAll('div[class="table-container');
    const index = tableFormula.length;
    const orcamentos = JSON.parse(orcamentosEdited)[0];
    var unidadesJson = orcamentos["unidades"]["ativos"][0];
    unidadesJson.unshift("");

    var unidadesDatalist = '';
    for (let i = 0; i < unidadesJson.length; i++) {
        unidadesDatalist += `<option value="${unidadesJson[i]}">${unidadesJson[i]}</option>
        `;
    }
    var formaFarmaceuticaAll = '';
    orcamentos["formaFarmaceuticaAll"].forEach(function (forma) {
        formaFarmaceuticaAll += `<option value="${forma}">${forma}</option>
        `;
    });
    var formaFarmaceuticaSubgrupoAll = '';
    orcamentos["formaFarmaceuticaSubgrupoAll"][orcamentos["formaFarmaceuticaAll"][0]].forEach(function (subgrupo) {
        formaFarmaceuticaSubgrupoAll += `<option value="${subgrupo}">${subgrupo}</option>
        `;
    });
    var embalagens = '';
    orcamentos["embalagens"].forEach(function (embalagem) {
        embalagens += `<option value="${embalagem}">${embalagem}</option>
        `;
    });
    var excipientes = '';
    orcamentos["excipientes"].forEach(function (excipiente) {
        excipientes += `<option value="${excipiente}">${excipiente}</option>
        `;
    });
    var tipoCapsulas = '';
    orcamentos["tipoCapsulas"].forEach(function (tipo) {
        tipoCapsulas += `<option value="${tipo}">${tipo}</option>
        `;
    });
    const newFormula = document.createElement("div");
    newFormula.className = "table-container";
    newFormula.id = "orcamento-" + index;
    newFormula.innerHTML = `
    <h2 class="table-title" style="margin-top: 1.5rem;">
        <button id="minusButton" class="minus-button"
            onclick="removeFormula(${index} )">-</button>
        <input id="nome-formula-${index}" class="table-title" type="text"
            value="" />
    </h2>
    <table>
        <tbody>
            <tr>
                <td class="required line1 right-line">Quantidade
                    <input id="quantidade-orcamento-${index}" type="text"
                        value="" size="10" />
                </td>
                <td class="required line1 right-line">Forma Farmacêutica
                    <select id="forma-farmaceutica-${index}" name="forma-farmaceutica"
                        onchange="updateSubgrupoDropdown(${index})">
                        ${formaFarmaceuticaAll}
                    </select>
                </td>
                <td class="required line1">Forma Farmacêutica (Subgrupo)
                    <select id="forma-farmaceutica-subgrupo-${index}"
                        name="forma-farmaceutica-subgrupo" style="width: 180px;">
                        ${formaFarmaceuticaSubgrupoAll}
                    </select>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Main Table with Dynamic Rows -->
    <table>
        <thead class="table-title">
            <tr class="header-row">
                <th class="line1 right-line" style="width: 604px;">Ativo Puro
                    <button id="minusButton" class="plus-button"
                        onclick="addAtivo(${index})">+</button>
                </th>
                <th class="line1 right-line" style="width: 180px;">Unidade</th>
                <th class="line1 right-line" style="width: 150px;">Quantidade</th>
                <th class="price-table-title">Preço</th>
            </tr>
        </thead>
        <tbody id="tbody-ativos">
            <tr id="ativo-0">
                <td class="required right-line text line1">
                    <datalist id="ativo-nome-${index}-0">
                        <option value="<%= opcao.nome %>" data-preco="<%= opcao.preco %>">
                    </datalist>
                    <button id="minusButton" class="minus-button"
                        onclick="removeAtivo(${index}, 0)">-</button>
                    <input id="ativo-puro-${index}-0" size="50"
                        value="" name="<%= opcao.nome %>"/>
                </td>
                <td class="required right-line text line1">
                    <select id="ativo-unidade" name="ativo-unidade-0">
                        ${unidadesDatalist}
                    </select>
                </td>
                <td class="number right-line required line1"
                    id="ativo-quantidade-0">
                    <input id="ativo-quantidade" type="text"
                        value="" size="8" />
                </td>
                <td id="preco-ativo-0"
                    class="price-table-value line1">
                    R$ 0,00
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Packaging Information -->
    <table>
        <thead>
            <tr class="header-row">
                <th class="line1 right-line" style="width: 604px;">Embalagem</th>
                <th class="line1 right-line" style="width: 330px; text-align: center;">Nº Embalagens
                </th>
                <th class="line1 price-table-title">Preço</th>
            </tr>
        </thead>
        <tbody>
            <tr id="embalagem">
                <td class="required right-line line1">
                    <datalist name="embalagens" id="embalagens">
                        ${embalagens}
                    </datalist>
                    <input id="embalagem-nome" autoComplete="on" list="embalagens" size="50"
                        value="" />
                </td>
                <td class="required line1 right-line" style="text-align: center;">
                    <input class="number" id="embalagem-quantidade" type="text"
                        value="" />
                </td>
                <td id="preco-embalagem" class="price-table-value line1">
                    R$ 0,00
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Additional Details -->
    <table>
        <thead>
            <tr>
                <th class="line1 right-line" style="width: 604px;">Excipiente</th>
                <th class="line1 right-line" style="width: 180px; text-align: center;">Unidade</th>
                <th class="line1 right-line" style="width: 150px; text-align: center;">Quantidade</th>
                <th class="price-table-title">Preço</th>
            </tr>
        </thead>
        <tbody>
            <tr id="excipiente">
                <td class="line1 right-line">
                    <datalist name="excipientes" id="excipientes">
                        ${excipientes}
                    </datalist>
                    <input id="excipiente-nome" autoComplete="on" list="excipientes" size="50"
                        value="" />
                </td>
                <td class="line1 right-line" id="excipiente-unidade" style="text-align: center;">
                    MG
                </td>
                <td class="number line1 right-line" id="excipiente-quantidade"
                    style="text-align: center;">
                    -
                </td>
                <td id="preco-excipiente" class="line1 price-table-value">
                    R$ 0,00
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Capsule Information -->
    <table>
        <thead>
            <tr>
                <th class="line1 right-line" style="width: 304px;">Tipo Cápsula</th>
                <th class="line1 right-line" style="width: 300px; text-align: center;">Cápsula</th>
                <th class="line1 right-line" style="width: 180px; text-align: center;">Unidade</th>
                <th class="line1 right-line" style="width: 150px; text-align: center;">Quantidade</th>
                <th class="line1 right-line" style="text-align: center;">Contém</th>
                <th class="price-table-title">Preço</th>
            </tr>
        </thead>
        <tbody>
            <tr id="capsula">
                <td class="required line1 right-line">
                    <select id="capsula-tipo" name="capsula-tipo" onchange="updateCapsulaDropdown()">
                        ${tipoCapsulas}
                    </select>
                </td>
                <td class="line1 right-line" style="text-align: center;">-</td>
                <td class="line1 right-line" style="text-align: center;">
                    <select id="capsula-unidade" name="capsula-unidade">
                        ${unidadesDatalist}
                    </select>
                <td class="line1 number right-line" id="capsula-quantidade" style="text-align: center;">
                </td>
                <td class="line1 number right-line" id="capsula-contem" name="capsula-contem"
                    style="text-align: center;">
                </td>
                <td id="preco-capsula" class="line1 price-table-value">
                    R$ 0,00
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
        <div class="total-row">
            <span>Custo Fixo</span>
            <span class="number">R$ 0,00
            </span>
        </div>
        <div class="total-row">
            <span>Total</span>
            <span id="total-preco" class="number">R$ 0,00</span>
        </div>
    </div>
    `
    tableFormula[tableFormula.length - 1].after(newFormula);
    addCounterOrcamentoEdited();
}

function removeFormula(index) {
    document.querySelector('div[id="orcamento-' + index + '"]').remove();
    subCounterOrcamentoEdited()
}

function addAtivo(index) {
    const tableAtivos = document.querySelector('div[id="orcamento-' + index + '"]').querySelector('tbody[id="tbody-ativos"]');
    const nodeAtivos = tableAtivos.querySelectorAll('tr');
    const newAtivo = document.createElement("tr");
    const indexAtivo = nodeAtivos.length;
    const orcamentos = JSON.parse(orcamentosEdited);
    var unidadesJson = orcamentos[0]["unidades"]["ativos"][0];
    unidadesJson.unshift("");
    var unidadesDatalist = '';
    for (let i = 0; i < unidadesJson.length; i++) {
        unidadesDatalist += `<option value="${unidadesJson[i]}">${unidadesJson[i]}</option>
        `;
    }
    newAtivo.id = "ativo-" + indexAtivo;
    newAtivo.innerHTML = `
    <td class="required right-line text line${(indexAtivo % 2) + 1}">
        <button id="minusButton" class="minus-button"
            onclick="removeAtivo(${index}, ${indexAtivo})">-</button>
        <input id="ativo-puro-${index}-${indexAtivo}" size="50"
            value="" />
    </td>
    <td class="required right-line text line${(indexAtivo % 2) + 1}">
        <select id="ativo-unidade" name="ativo-unidade-${indexAtivo}">
            ${unidadesDatalist}
        </select>
    </td>
    <td class="number right-line required line${(indexAtivo % 2) + 1}"
        id="ativo-quantidade-${indexAtivo}">
        <input id="ativo-quantidade" type="text"
            value="" size="8" />
    </td>
    <td id="preco-ativo-${indexAtivo}"
        class="price-table-value line${(indexAtivo % 2) + 1}">
        R$ 0,00
    </td>
    `
    tableAtivos.appendChild(newAtivo);
    addCounterOrcamentoEdited();
}

function removeAtivo(index, indexAtivo) {
    document.querySelector('div[id="orcamento-' + index + '"]').querySelector('tr[id="ativo-' + indexAtivo + '"]').remove();
    subCounterOrcamentoEdited()
}