document.getElementById('home-btn').addEventListener('click', new_budget, false);
document.getElementById('table-btn').addEventListener('click', show_table, false);
document.getElementById('close-table-btn').addEventListener('click', close_table, false);

function new_budget(e) {
    console.log("Reset budget");
    window.location.replace('/');
}

function show_table(e) {
    // check if table size is greater than 0
    console.log(window.location);
    if (window.location.href.includes("https://")){
        var endpoint = "https://" + window.location.host + "/table"
    }else {
        var endpoint = "http://" + window.location.host + "/table"
    }
    console.log(endpoint)
    document.getElementById("overlay").classList.remove("hidden");
    var resultHeader = document.getElementById("result-head");
    if(resultHeader){
        resultHeader.classList.add("hidden");
    }
    fetch(endpoint, { method: "GET" }).then((response) => response.json()).then((json) => build_table(json))
}

function close_table(e) {
    console.log("close");
    document.getElementById("overlay").classList.add("hidden");
    var resultHeader = document.getElementById("result-head");
    if(resultHeader){
        resultHeader.classList.remove("hidden");
    }
}

function build_table(json) {
    // Build product table
    var table_hd = '<thead><tr>    <th>Produto</th>    <th style="font-weight: bold; text-align: right;">Unidade</th>    <th style="text-align: right;">Valor unitário</th>  </tr></thead><tbody>'
    var table_content = ''
    for (var i = 0, item; item = json.items[i]; i++) {
        table_content += '<tr class="table-row"> <td class="med-name">';
        table_content += item.nome;
        table_content += '</td> <td class="med-value">';
        table_content += item.unidade;
        table_content += '</td> <td class="med-value"> R$ ';
        table_content += item.preco;
        table_content += ',00</td> </tr>';
    }
    table_content += '</tbody>'
    var m = document.getElementById('product-table');
    m.innerHTML = table_hd + table_content;
}