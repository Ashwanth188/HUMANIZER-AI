async function readTxt(file) {
  return file.text()
}

async function readDocx(file) {
  const mod = await import('mammoth/mammoth.browser.js')
  const mammoth = mod.default || mod
  const arrayBuffer = await file.arrayBuffer()
  const { value } = await mammoth.extractRawText({ arrayBuffer })
  return value
}

async function readPdf(file) {
  const pdfjsLib = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pageTexts = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pageTexts.push(content.items.map((item) => item.str).join(' '))
  }
  return pageTexts.join('\n\n')
}

/**
 * Extract plain text from an uploaded .txt, .docx, or .pdf file.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file) {
  const name = file.name.toLowerCase()

  if (name.endsWith('.txt')) return readTxt(file)
  if (name.endsWith('.docx')) return readDocx(file)
  if (name.endsWith('.pdf')) return readPdf(file)

  throw new Error('Unsupported file type. Please upload a .txt, .docx, or .pdf file.')
}
