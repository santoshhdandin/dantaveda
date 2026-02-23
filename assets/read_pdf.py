import PyPDF2
reader = PyPDF2.PdfReader('resume.pdf')
print(''.join([page.extract_text() for page in reader.pages]))
