import simplejson as json, re, pandas as pd, os, time

from ativo.main import ativoClass
from unidecode import unidecode


DEFAULT_CONTENT_TYPE = 'application/json'

HTTP_STATUS_OK = 200
HTTP_STATUS_BAD_REQUEST = 400
HTTP_STATUS_UNAUTHORIZED = 401
HTTP_STATUS_FORBIDDEN = 403
HTTP_STATUS_NOT_FOUND = 404
HTTP_STATUS_INTERNAL_SERVER_ERROR = 500


def respond_not_found(error='not found'):
    return make_lambda_response(HTTP_STATUS_NOT_FOUND, {'error': error})


def respond_bad_request(error='bad request'):
    return make_lambda_response(HTTP_STATUS_BAD_REQUEST, {'error': error})


def respond_unauthorized(error='unauthorized'):
    return make_lambda_response(HTTP_STATUS_UNAUTHORIZED, {'error': error})


def respond_forbidden(error='forbidden'):
    return make_lambda_response(HTTP_STATUS_FORBIDDEN, {'error': error})


def respond_internal_server_error(error='internal server error'):
    return make_lambda_response(HTTP_STATUS_INTERNAL_SERVER_ERROR, {'error': error})


def make_lambda_response(status_code, body=None, headers={}, multi_value_headers={}):
    response = {
        'statusCode': status_code,
    }
    if 'content-type' not in [k.lower() for k in headers.keys()]:
        headers['Content-Type'] = DEFAULT_CONTENT_TYPE
    if "Access-Control-Allow-Origin" not in headers:
        headers["Access-Control-Allow-Origin"] = "*"
    if "Access-Control-Allow-Headers" not in headers:
        headers["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept"
    if "Access-Control-Allow-Methods" not in headers:
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


def do_descr_match(target, df: pd.DataFrame, starts_with=False):
    if starts_with:
        if df['DESCR'].str.startswith(target, na=False).any():
            return df[df['DESCR'].str.startswith(target, na=False)]
    else:
        if df['DESCR'].str.contains(target, regex=False, case=False, na=False).any():
            return df[
                df['DESCR'].str.contains(target, regex=False, case=False, na=False)
            ]
    return []


def parse_matchs(all_matchs: pd.DataFrame):
    if len(all_matchs) == 0:
        return all_matchs
    all_matchs = all_matchs[
        ~all_matchs['DESCR'].str.contains(
            '|'.join(['Ñ USAR', 'N USAR', 'NAO USAR', 'NÃO USAR']), case=False, na=False
        )
    ]
    all_matchs = all_matchs.drop_duplicates()
    all_matchs = all_matchs.sort_values(by='DESCR')
    return all_matchs


def find_closest_match_contains(df: pd.DataFrame, target: str):
    target = unidecode(target.upper())
    # Exact match
    start_time = time.time()
    if len(df[df['DESCR'] == target]) > 0:
        tempo = time.time() - start_time
        print(f"Exact match: {tempo}")
        return df[df['DESCR'] == target]
    tempo = time.time() - start_time
    print(f"Exact match: {tempo}")

    all_matchs = pd.DataFrame()

    # Step 1: Full match
    start_time = time.time()
    matchs = do_descr_match(target, df)
    if len(matchs) > 0:
        all_matchs = pd.concat([all_matchs, matchs])
    tempo = time.time() - start_time
    print(f"Full match: {tempo}")

    # Step 2: Match between combinations using 2 words with at least
    # 2 letters of each one when possible
    start_time = time.time()
    words = target.split()
    if len(words) > 1:
        words = words[0:2]
        if len(words[1]) >= 2:
            size_letters = re.search(r'^([\W\d]*\w{1,2})', words[1].strip()).group(1)
            for i in range(len(words[1]), len(size_letters)-1, -1):
                word_1 = words[1][:i]
                for j in range(len(words[0]), 1, -1):
                    shortened_name = f"{words[0][:j]} {word_1}"
                    matchs = do_descr_match(shortened_name, df, starts_with=True)
                    if len(matchs) > 0:
                        all_matchs = pd.concat([all_matchs, matchs])
        else:
            for i in range(len(words[0]), 1, -1):
                shortened_name = f"{words[0][:i]} {words[1]}"
                matchs = do_descr_match(shortened_name, df, starts_with=True)
                if len(matchs) > 0:
                    all_matchs = pd.concat([all_matchs, matchs])
    if len(all_matchs) > 0:
        all_matchs = parse_matchs(all_matchs)
        tempo = time.time() - start_time
        print(f"Two words: {tempo}")
        return all_matchs
    tempo = time.time() - start_time
    print(f"Two words: {tempo}")

    # Step 3: Match with the first word using at least 3 letters
    start_time = time.time()
    shortened_name = unidecode(words[0][0:2])
    matchs = do_descr_match(shortened_name, df, starts_with=True)
    if len(matchs) > 0:
        all_matchs = pd.concat([all_matchs, matchs])

    all_matchs = parse_matchs(all_matchs)
    tempo = time.time() - start_time
    print(f"First word: {tempo}")
    return all_matchs


def calc_price(ativo: ativoClass, forma_farmaceutica: str, dosagem: int):
    ativo.orcamento.price = (
        ativo.price
        * ativo.dilution
        * ativo.equivalency
        * ativo.orcamento.quantity
        * unityCalcConversion(ativo.orcamento.unity)
        / ativo.unity_value_conversion
    )
    if forma_farmaceutica not in ['']:
        ativo.orcamento.price *= dosagem
    ativo.orcamento.price = round(ativo.orcamento.price, 2)


def adjust_csv(df: pd.DataFrame):
    def transform_values(value):
        if isinstance(value, str):
            value = re.sub(r'\s+', ' ', value)
            value = value.upper().strip()
        return value

    df = df.map(transform_values)
    return df


if __name__ == '__main__':
    folder_path = './orcamento_tables/smart'
    for filename in os.listdir(folder_path):
        file_path = os.path.join(folder_path, filename)
        if os.path.isfile(file_path):
            df = pd.read_csv(file_path)
            df = adjust_csv(df)
            df.to_csv(file_path, index=False)
