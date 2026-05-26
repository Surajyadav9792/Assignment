import PDFDocument from 'pdfkit';

const INR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n || 0
  );

export function streamQuotePdf(quote, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${quote.quoteNumber}.pdf"`);
  doc.pipe(res);

  // Header band
  doc.rect(0, 0, doc.page.width, 90).fill('#0E1116');
  doc.fillColor('#E6EAF0').fontSize(22).text('FORGEFLOW', 50, 32);
  doc.fontSize(10).fillColor('#8B95A3').text('Manufacturing Sales, Refined.', 50, 58);
  doc.fillColor('#E6EAF0').fontSize(11).text(quote.quoteNumber, doc.page.width - 200, 38, {
    width: 150,
    align: 'right',
  });
  doc.fontSize(9).fillColor('#8B95A3').text(
    `Issued: ${new Date(quote.createdAt).toLocaleDateString('en-IN')}`,
    doc.page.width - 200,
    56,
    { width: 150, align: 'right' }
  );

  doc.fillColor('#0E1116');
  doc.moveDown(4);

  // Bill To
  doc.fontSize(9).fillColor('#5A6573').text('BILL TO', 50, 120);
  doc.fontSize(13).fillColor('#0E1116').text(quote.lead?.companyName || '—', 50, 134);
  doc.fontSize(10).fillColor('#5A6573').text(quote.lead?.contactName || '', 50, 152);
  if (quote.lead?.email) doc.text(quote.lead.email, 50, 166);

  doc.fontSize(9).fillColor('#5A6573').text('QUOTE STATUS', 350, 120);
  doc.fontSize(13).fillColor('#0E1116').text(quote.status.toUpperCase(), 350, 134);
  if (quote.validUntil) {
    doc.fontSize(9).fillColor('#5A6573').text('VALID UNTIL', 350, 158);
    doc
      .fontSize(11)
      .fillColor('#0E1116')
      .text(new Date(quote.validUntil).toLocaleDateString('en-IN'), 350, 172);
  }

  // Items table
  const startY = 220;
  const cols = [
    { x: 50, w: 220, label: 'Product' },
    { x: 270, w: 50, label: 'Qty' },
    { x: 320, w: 70, label: 'Unit ₹' },
    { x: 390, w: 50, label: 'Disc%' },
    { x: 440, w: 105, label: 'Total ₹' },
  ];

  doc.rect(50, startY - 6, doc.page.width - 100, 24).fill('#F4F6FA');
  doc.fillColor('#5A6573').fontSize(9);
  cols.forEach((c) => doc.text(c.label.toUpperCase(), c.x + 4, startY, { width: c.w - 8 }));

  let y = startY + 26;
  doc.fillColor('#0E1116').fontSize(10);
  (quote.items || []).forEach((it, idx) => {
    if (idx % 2 === 1) doc.rect(50, y - 4, doc.page.width - 100, 22).fill('#FAFBFD');
    doc.fillColor('#0E1116');
    doc.text(it.productName || '—', cols[0].x + 4, y, { width: cols[0].w - 8 });
    doc.text(String(it.quantity || 0), cols[1].x + 4, y);
    doc.text(INR(it.unitPrice), cols[2].x + 4, y, { width: cols[2].w - 8 });
    doc.text(`${it.discountPct || 0}%`, cols[3].x + 4, y);
    doc.text(INR(it.total), cols[4].x + 4, y, { width: cols[4].w - 8, align: 'right' });
    y += 22;
  });

  // Totals
  y += 16;
  doc.moveTo(360, y - 6).lineTo(545, y - 6).strokeColor('#E6EAF0').stroke();
  doc.fontSize(10).fillColor('#5A6573').text('Subtotal', 360, y);
  doc.fillColor('#0E1116').text(INR(quote.subtotal), 460, y, { width: 85, align: 'right' });
  y += 18;
  doc.fillColor('#5A6573').text(`Tax (${quote.taxPct}%)`, 360, y);
  doc.fillColor('#0E1116').text(INR(quote.taxAmount), 460, y, { width: 85, align: 'right' });
  y += 22;
  doc.rect(355, y - 4, 195, 28).fill('#0E1116');
  doc.fillColor('#E6EAF0').fontSize(11).text('Grand Total', 365, y + 3);
  doc.fillColor('#E6EAF0').fontSize(13).text(INR(quote.grandTotal), 460, y, {
    width: 85,
    align: 'right',
  });

  if (quote.notes) {
    y += 60;
    doc.fillColor('#5A6573').fontSize(9).text('NOTES', 50, y);
    doc.fillColor('#0E1116').fontSize(10).text(quote.notes, 50, y + 14, { width: 495 });
  }

  // Footer
  doc.fillColor('#5A6573').fontSize(8).text(
    'ForgeFlow • Manufacturing Operations Suite • forgeflow.com',
    50,
    doc.page.height - 50,
    { align: 'center', width: doc.page.width - 100 }
  );

  doc.end();
}
