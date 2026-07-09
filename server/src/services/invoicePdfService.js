const PDFDocument = require('pdfkit');
const path = require('path');

exports.createInvoiceDocument = (payment, writable) => {
    const doc = new PDFDocument({
        margin: 0,
        size: 'A4',
        info: {
            Title: payment.invoiceNumber,
            Author: 'Badminton Booking',
            Subject: 'Payment invoice',
        },
    });

    const regularFont = path.join(__dirname, '../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
    const boldFont = path.join(__dirname, '../../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf');
    doc.registerFont('Noto', regularFont);
    doc.registerFont('Noto-Bold', boldFont);
    if (writable) doc.pipe(writable);

    const green = '#006948';
    const dark = '#17201d';
    const muted = '#66736c';
    const light = '#f2f6f4';
    const line = '#dbe5df';
    const pageWidth = doc.page.width;
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    const money = `${Number(payment.amount).toLocaleString('vi-VN')} VND`;
    const paidAt = payment.paidAt ? payment.paidAt.toLocaleString('vi-VN') : '-';
    const statusMap = {
        paid: ['PAID', '#e1f4eb', green],
        refund_pending: ['REFUND PENDING', '#fff3d6', '#8a5b00'],
        refunded: ['REFUNDED', '#e7eefc', '#2759a5'],
        refund_failed: ['REFUND REJECTED', '#fde8e7', '#a2322d'],
    };
    const [statusLabel, statusBackground, statusColor] = statusMap[payment.status] || ['PAID', '#e1f4eb', green];

    doc.rect(0, 0, pageWidth, 118).fill(green);
    doc.circle(margin + 22, 47, 22).fill('#ffffff');
    doc.font('Noto-Bold').fontSize(22).fillColor(green).text('B', margin + 14, 32, { width: 18, align: 'center' });
    doc.font('Noto-Bold').fontSize(19).fillColor('#ffffff').text('BADMINTON BOOKING', margin + 56, 31);
    doc.font('Noto').fontSize(9).fillColor('#d9f5e9').text('TRAIN - PLAY - GROW', margin + 57, 60, { characterSpacing: 1.2 });
    doc.font('Noto-Bold').fontSize(28).fillColor('#ffffff').text('INVOICE', pageWidth - margin - 190, 28, { width: 190, align: 'right' });
    doc.font('Noto').fontSize(9).fillColor('#d9f5e9').text(payment.invoiceNumber, pageWidth - margin - 230, 66, { width: 230, align: 'right' });

    doc.font('Noto-Bold').fontSize(9).fillColor(muted).text('ISSUED DATE', margin, 145);
    doc.font('Noto').fontSize(10).fillColor(dark).text(paidAt, margin, 162);
    doc.font('Noto-Bold').fontSize(9).fillColor(muted).text('PAYMENT METHOD', margin + 175, 145);
    doc.font('Noto').fontSize(10).fillColor(dark).text(`VNPAY${payment.bankCode ? ` - ${payment.bankCode}` : ''}`, margin + 175, 162);
    doc.roundedRect(pageWidth - margin - 132, 143, 132, 28, 14).fill(statusBackground);
    doc.font('Noto-Bold').fontSize(8).fillColor(statusColor).text(statusLabel, pageWidth - margin - 126, 153, { width: 120, align: 'center' });

    doc.roundedRect(margin, 202, contentWidth, 78, 8).fill(light);
    doc.font('Noto-Bold').fontSize(9).fillColor(green).text('BILLED TO', margin + 18, 218);
    doc.font('Noto-Bold').fontSize(12).fillColor(dark).text(payment.user.name, margin + 18, 238, { width: 220, ellipsis: true });
    doc.font('Noto').fontSize(9).fillColor(muted).text(payment.user.email, margin + 18, 258, { width: 240, ellipsis: true });
    doc.font('Noto-Bold').fontSize(9).fillColor(green).text('TRANSACTION', margin + 310, 218);
    doc.font('Noto').fontSize(9).fillColor(dark).text(payment.txnRef, margin + 310, 239, { width: contentWidth - 328, align: 'right' });
    doc.font('Noto').fontSize(8).fillColor(muted).text(payment.providerTransactionNo ? `VNPAY Ref: ${payment.providerTransactionNo}` : 'VNPAY Sandbox', margin + 310, 258, { width: contentWidth - 328, align: 'right' });

    const tableTop = 315;
    doc.roundedRect(margin, tableTop, contentWidth, 34, 6).fill(green);
    doc.font('Noto-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('CLASS / DESCRIPTION', margin + 14, tableTop + 12, { width: 250 });
    doc.text('SCHEDULE', margin + 285, tableTop + 12, { width: 105 });
    doc.text('AMOUNT', margin + 395, tableTop + 12, { width: contentWidth - 409, align: 'right' });
    doc.rect(margin, tableTop + 34, contentWidth, 105).fill('#ffffff').stroke(line);
    doc.font('Noto-Bold').fontSize(11).fillColor(dark).text(payment.class.title, margin + 14, tableTop + 50, { width: 250, height: 34, ellipsis: true });
    doc.font('Noto').fontSize(8.5).fillColor(muted).text(`Coach: ${payment.class.coachName}`, margin + 14, tableTop + 88, { width: 250, ellipsis: true });
    doc.text(`Location: ${payment.class.location}`, margin + 14, tableTop + 104, { width: 250, ellipsis: true });
    doc.font('Noto').fontSize(8.5).fillColor(dark).text(payment.class.schedule, margin + 285, tableTop + 51, { width: 105, height: 48, ellipsis: true });
    if (payment.class.startDate) doc.fillColor(muted).text(new Date(payment.class.startDate).toLocaleDateString('vi-VN'), margin + 285, tableTop + 105, { width: 105 });
    doc.font('Noto-Bold').fontSize(11).fillColor(dark).text(money, margin + 395, tableTop + 51, { width: contentWidth - 409, align: 'right' });

    const summaryTop = 478;
    doc.font('Noto').fontSize(9).fillColor(muted).text('Subtotal', pageWidth - margin - 225, summaryTop, { width: 105 });
    doc.fillColor(dark).text(money, pageWidth - margin - 115, summaryTop, { width: 115, align: 'right' });
    doc.fillColor(muted).text('Processing fee', pageWidth - margin - 225, summaryTop + 24, { width: 105 });
    doc.fillColor(dark).text('0 VND', pageWidth - margin - 115, summaryTop + 24, { width: 115, align: 'right' });
    doc.moveTo(pageWidth - margin - 225, summaryTop + 49).lineTo(pageWidth - margin, summaryTop + 49).strokeColor(line).stroke();
    doc.font('Noto-Bold').fontSize(11).fillColor(green).text('TOTAL', pageWidth - margin - 225, summaryTop + 65, { width: 105 });
    doc.fontSize(15).text(money, pageWidth - margin - 135, summaryTop + 61, { width: 135, align: 'right' });

    doc.roundedRect(margin, 592, contentWidth, 72, 8).fill(light);
    doc.font('Noto-Bold').fontSize(10).fillColor(dark).text('Payment confirmed', margin + 18, 608);
    doc.font('Noto').fontSize(8.5).fillColor(muted).text('This invoice was generated automatically after VNPAY confirmed the transaction. Keep it for your records.', margin + 18, 628, { width: contentWidth - 36, lineGap: 2 });

    doc.moveTo(margin, 754).lineTo(pageWidth - margin, 754).strokeColor(line).stroke();
    doc.font('Noto-Bold').fontSize(9).fillColor(green).text('Thank you for choosing Badminton Booking!', margin, 770, { width: contentWidth, align: 'center' });
    doc.font('Noto').fontSize(7.5).fillColor(muted).text('This is a system-generated invoice and does not require a signature.', margin, 790, { width: contentWidth, align: 'center' });

    return doc;
};
