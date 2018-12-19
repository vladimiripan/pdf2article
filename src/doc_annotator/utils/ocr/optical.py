from PyPDF2 import PdfFileWriter, PdfFileReader
import os
from doc_annotator import app
import pytesseract
import random


def ocr_file(borders, file_name):
    characteristics = borders
    for border_page in borders:
        for idx, b in enumerate(borders[border_page]):
            chs = []
            for i in range(app.config['NUMBER_OF_CHARACTERISTICS']):
                chs.append(random.randint(0, 100))
            val = list(b)
            val.append(tuple(chs))
            characteristics[border_page][idx] = tuple(val)

    return characteristics

    # trebuie discutat mai mult aici
    # to do
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
    with open(file_path, "rb") as in_f:
        input1 = PdfFileReader(in_f)
        output = PdfFileWriter()

        numPages = input1.getNumPages()
        print("document has %s pages." % numPages)
        for page in borders.keys():
            page = input1.getPage(page)
            boxes = borders[page]
            for box in boxes:
                print(page.mediaBox.getUpperRight_x(), page.mediaBox.getUpperRight_y())
                page.trimBox.upperLeft = (box[0], box[1])
                page.trimBox.upperRight = (box[2], box[1])
                page.trimBox.lowerLeft = (box[0], box[3])
                page.trimBox.lowerRight = (box[2], box[3])

                output.addPage(page)

        # with open("out.pdf", "wb") as out_f:
        #     output.write(out_f)

# ocr_file({1:[(0,0,100,100),(50,50,150,150)]},"pdf-test.pdf")

# {1 : [(x1,y1,x2,y2), (x,y,x,y) ...]}
