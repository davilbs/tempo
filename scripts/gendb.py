import sqlite3
from random import uniform
from unidecode import unidecode

con = sqlite3.connect("pharmacy.db")
cur = con.cursor()
cur.execute("CREATE TABLE medicines(name, dosage, value)")
with open("Ativos.csv", "r") as sourc:
    for line in sourc.readlines():
        line = line.split(";")
        value = round(uniform(1, 3), 2)
        print(f"INSERT INTO medicines VALUES ('{unidecode(line[0].upper())}', {float(line[1].lstrip().rstrip())}, {value});")
        cur.execute(f"INSERT INTO medicines VALUES ('{unidecode(line[0].upper())}', {float(line[1].lstrip().rstrip())}, {value});")
        cur.execute('COMMIT')

cur.execute("SELECT * FROM medicines")
rows = cur.fetchall()
print("MEDICINE TABLE")
for row in rows:
    print(row)
cur.close()