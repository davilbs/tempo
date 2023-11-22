import sqlite3
import sys
import json
import os

def main():
    path = os.path.dirname(os.path.abspath(__file__))

    con = sqlite3.connect(path + "/pharmacy.db")
    cur = con.cursor()
    cur.execute("SELECT * FROM medicines")
    rows = cur.fetchall()
    table_json = {"items": []}
    for row in rows:
        table_json["items"].append({"nome": f"{row[0]}", "unidade": f"{row[1]}", "preco": f"{row[2]}"})
    return table_json

if __name__ == "__main__":
    table_json = main()
    print(json.dumps(table_json))
    sys.stdout.flush()