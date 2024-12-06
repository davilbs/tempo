# index.py
import utils, json

from orcamento import orcamentoClass
from pre_orcamento import preOrcamentoClass
from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/calculate_orcamento', methods=['POST'])
def calculate_orcamento():
    body = json.loads(request.data.decode('utf-8'))['pre_orcamento']
    orcamento = preOrcamentoClass(
        body['ativos'],
        body['dosagem'],
        body['forma_farmaceutica'],
        body['sub_forma_farmaceutica'],
        body['nome_medico'],
        body['nome_cliente'],
    )
    result = orcamento.create_pre_orcamento()
    value_return = utils.make_lambda_response(utils.HTTP_STATUS_OK, {'result': result})
    return value_return


@app.route('/update_orcamento', methods=['POST'])
def update_orcamento():
    body = json.loads(request.data.decode('utf-8'))['orcamento']
    result = orcamentoClass(body).create_orcamento()
    value_return = utils.make_lambda_response(utils.HTTP_STATUS_OK, {'result': result})
    return value_return


if __name__ == '__main__':
    app.run(debug=True)
