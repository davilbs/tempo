# https://tesseract-ocr.github.io/
import os
import sys
from PIL import Image
from tika import parser


def scan(raw, document, rootpath):
    text = raw["content"]
    text = text.lstrip().rstrip()
    nome = document.split("/")[-1].split(".")[0]
    with open(f"{rootpath}/backend/scans/{nome}.txt", 'w+') as dumpfile:
        dumpfile.write(text)
        dumpfile.close()

def main():
    headers = {"X-Tika-OCRLanguage": "por"}
    rootpath = os.path.dirname(os.getcwd())
    document = rootpath + "/backend/uploads/" + sys.argv[1]
    
    exten = document.split(".")[1]
    if exten == "pdf":
        raw = parser.from_file(document)
    else:
        im = Image.open(document)
        w, h = im.size
        im_resized = im.resize((w, h), resample=Image.HAMMING)
        im_resized.save(document)
        raw = parser.from_file(document, headers=headers)

    if raw["content"] == None:
        return "fail"
    else:
        scan(raw, document, rootpath)
        nome = document.split("/")[-1].split(".")[0]
        return nome

if __name__ == "__main__":    
    result = main()
    print(f"{result}.txt", end='')
    sys.stdout.flush()
