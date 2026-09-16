function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportAsTxt(text, filename = 'humanized-text.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, filename)
}

export async function exportAsDocx(text, filename = 'humanized-text.docx') {
  const { Document, Packer, Paragraph } = await import('docx')
  const paragraphs = text
    .split(/\n+/)
    .filter((line) => line.trim())
    .map((line) => new Paragraph(line))

  const doc = new Document({
    sections: [{ children: paragraphs.length ? paragraphs : [new Paragraph('')] }],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}

export async function exportAsPdf(text, filename = 'humanized-text.pdf') {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const margin = 48
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - margin * 2
  const lineHeight = 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)

  const lines = doc.splitTextToSize(text, maxWidth)
  let y = margin

  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += lineHeight
  }

  doc.save(filename)
}
