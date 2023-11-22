import sqlite3
from random import randint

con = sqlite3.connect("pharmacy.db")
cur = con.cursor()
cur.execute("CREATE TABLE medicines(name, dosage, value)")
with open("medicines.txt", "r") as sourc:
    for line in sourc.readlines():
        line = line.split(":")
        value = randint(1, 50)
        print(f"INSERT INTO medicines VALUES ('{line[0].upper()}', '{line[1].lstrip().rstrip()}', {value});")
        cur.execute(f"INSERT INTO medicines VALUES ('{line[0].upper()}', '{line[1].lstrip().rstrip()}', {value});")
        cur.execute('COMMIT')

cur.execute("SELECT * FROM medicines")
rows = cur.fetchall()
print("MEDICINE TABLE")
for row in rows:
    print(row)
cur.close()