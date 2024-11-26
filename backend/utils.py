import simplejson as json

DEFAULT_CONTENT_TYPE = 'application/json'

HTTP_STATUS_OK = 200
HTTP_STATUS_BAD_REQUEST = 400
HTTP_STATUS_UNAUTHORIZED = 401
HTTP_STATUS_FORBIDDEN = 403
HTTP_STATUS_NOT_FOUND = 404
HTTP_STATUS_INTERNAL_SERVER_ERROR = 500

def respond_not_found(error='not found'):
    return make_lambda_response(
        HTTP_STATUS_NOT_FOUND,
        {'error': error}
    )

def respond_bad_request(error='bad request'):
    return make_lambda_response(
        HTTP_STATUS_BAD_REQUEST,
        {'error': error}
    )

def respond_unauthorized(error='unauthorized'):
    return make_lambda_response(
        HTTP_STATUS_UNAUTHORIZED,
        {'error': error}
    )

def respond_forbidden(error='forbidden'):
    return make_lambda_response(
        HTTP_STATUS_FORBIDDEN,
        {'error': error}
    )

def respond_internal_server_error(error='internal server error'):
    return make_lambda_response(
        HTTP_STATUS_INTERNAL_SERVER_ERROR,
        {'error': error}
    )

def make_lambda_response(status_code, body=None, headers={}, multi_value_headers={}):
    response = {
        'statusCode': status_code,
    }
    if 'content-type' not in [k.lower() for k in headers.keys()]:
        headers['Content-Type'] = DEFAULT_CONTENT_TYPE
    if ("Access-Control-Allow-Origin" not in headers):
        headers["Access-Control-Allow-Origin"] = "*"
    if ("Access-Control-Allow-Headers" not in headers):
        headers["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept"
    if ("Access-Control-Allow-Methods" not in headers):
        headers["Access-Control-Allow-Methods"] = "GET,OPTIONS,PUT"
    response['headers'] = headers
    response['multiValueHeaders'] = multi_value_headers
    if body is not None:
        response['body'] = json.dumps(body)
    return response

def unityCalcConversion(unity: str):
    unity = unity.upper()
    if unity == '%':
        return 0.01
    elif unity == 'MG':
        return 0.001
    elif unity == 'MCG':
        return 0.000001
    elif unity == 'KG':
        return 1000
    elif unity == 'L':
        return 1000
    else:
        return 1