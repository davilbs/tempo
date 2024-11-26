# index.py
import utils, json

from orcamento import orcamentoClass
from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/calculate_orcamento', methods=['POST'])
def calculate_orcamento():
    body = request.form.to_dict()
    # Need to initialize this ocamentoClass as the file "calc_orcamento.py"
    # This body fields are only alias to the what the class expect
    # We can ignore getting the correct forma farmaceutica and sub_forma_farmaceutica
    # Pass as it is in the "calc_orcamento.py" file
    orcamento = orcamentoClass(
        body['ativos'],
        body['quantity'],
        body['forma_farmaceutica'],
        body['sub_forma_farmaceutica'],
    )
    result = orcamento.create_orcamento()
    value_return = utils.make_lambda_response(utils.HTTP_STATUS_OK, {'result': result})
    return value_return


@app.route('/update_orcamento', methods=['POST'])
def update_orcamento():
    body = json.loads(request.data.decode('utf-8'))['orcamento']
    result = orcamentoClass(
        body['ativos'],
        body['quantity'],
        body['formaFarmaceutica'],
        body['formaFarmaceuticaSubgrupo'],
    ).getPrice(body)
    value_return = utils.make_lambda_response(utils.HTTP_STATUS_OK, {'result': result})
    return value_return


if __name__ == '__main__':
    app.run(debug=True)
