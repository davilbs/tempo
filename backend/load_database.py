import sqlite3
import pandas as pd
import os

def convert_csv_to_sql(filepath):
    df = pd.read_csv(filepath)
    conn = sqlite3.connect(f'{filepath.strip(".csv")}.db')
    df.to_sql(filepath.split('/')[-1].strip(".csv"), conn, if_exists='replace', index=False) 

if __name__ == "__main__":
    for file in os.listdir("orcamento_tables/smart/"):
        print("Converting", file)
        convert_csv_to_sql("orcamento_tables/smart/" + file)