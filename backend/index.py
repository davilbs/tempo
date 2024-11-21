# index.py
import utils

from orcamento import orcamentoClass
from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route('/calc_orcamento', methods=['POST'])
def extract_result_route():
    body = request.form.to_dict()
    orcamento = orcamentoClass(
        body['ativos'],
        body['quantity'],
        body['forma_farmaceutica'],
        body['sub_forma_farmaceutica'],
    )
    result = orcamento.create_orcamento()
    value_return = utils.make_lambda_response(utils.HTTP_STATUS_OK, {'result': result})
    return value_return


if __name__ == '__main__':
    app.run(debug=True)
