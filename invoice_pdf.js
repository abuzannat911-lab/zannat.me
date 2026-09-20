/**
 * Invoice PDF Generator for Zannat.bd
 * High-resolution, professional vector PDF generation matching the official web preview.
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function getCurrencySymbol(curr) {
    switch (curr) {
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'BDT': return '৳';
        case 'CAD': return 'CA$';
        case 'AUD': return 'AU$';
        default: return '$';
    }
}

/**
 * Generate a PDF Buffer for an invoice matching the exact preview modal design
 * @param {Object} invoice 
 * @returns {Promise<Buffer>}
 */
function generateInvoicePDFBuffer(invoice) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 36,
                info: {
                    Title: `Commercial Invoice ${invoice.number || 'Invoice'}`,
                    Author: 'Abu Zannat',
                    Subject: `Invoice ${invoice.number || ''} for ${invoice.clientName || invoice.clientCompany || 'Client'}`,
                    Keywords: 'Invoice, WordPress, Development, Commercial'
                }
            });

            const buffers = [];
            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', err => reject(err));

            const currency = invoice.currency || 'USD';
            const symbol = getCurrencySymbol(currency);
            const totalVal = parseFloat(invoice.total) || 0;
            const subtotalVal = parseFloat(invoice.subtotal) || totalVal;
            const taxRateVal = parseFloat(invoice.taxRate) || 0;
            const taxAmountVal = parseFloat(invoice.taxAmount) || 0;
            const status = (invoice.status || 'Paid').toUpperCase();

            // Color Palette matching the preview screenshot
            const colorPrimary = '#4f46e5';   // Indigo
            const colorText = '#0f172a';      // Slate 900
            const colorMuted = '#64748b';     // Slate 500
            const colorBorder = '#e2e8f0';    // Slate 200
            const colorCardBg = '#ffffff';    // White
            const colorGrayBg = '#f8fafc';    // Slate 50
            const colorGreen = '#16a34a';     // Green 600
            const colorDarkGreen = '#166534'; // Green 800

            let y = 36;

            // ==========================================
            // 1. TOP HEADER SECTION
            // ==========================================
            const logoPath = path.join(__dirname, 'assets', 'zannat_inner_symbol_icon.png');
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, 36, y, { width: 44, height: 44 });
                } catch (e) {}
            }

            // Left branding
            doc.fontSize(17).font('Helvetica-Bold').fillColor(colorText)
               .text('Abu Zannat', 88, y);
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor(colorPrimary)
               .text('WordPress Specialist & Web Developer', 88, y + 20);
            doc.fontSize(8).font('Helvetica').fillColor(colorMuted)
               .text('Independent Contractor • Non-US Person • https://zannat.bd', 88, y + 33);

            // Right title & invoice number
            doc.fontSize(17).font('Helvetica-Bold').fillColor(colorText)
               .text('COMMERCIAL INVOICE', 280, y, { align: 'right', width: 279 });
            doc.fontSize(8).font('Helvetica-Bold').fillColor(colorMuted)
               .text('TAX INVOICE / EXPORT OF SERVICES', 280, y + 20, { align: 'right', width: 279 });
            doc.fontSize(13).font('Helvetica-Bold').fillColor(colorPrimary)
               .text(invoice.number || 'INV-1001', 280, y + 31, { align: 'right', width: 279 });

            // Status Pill Badge
            const badgeW = 75;
            const badgeH = 14;
            const badgeX = 559 - badgeW;
            const badgeY = y + 47;
            const isPaid = status === 'PAID';
            const isDue = status === 'DUE';
            const sBg = isPaid ? '#dcfce7' : (isDue ? '#fef3c7' : '#fee2e2');
            const sTxt = isPaid ? '#15803d' : (isDue ? '#b45309' : '#b91c1c');

            doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 7).fill(sBg);
            doc.fontSize(7).font('Helvetica-Bold').fillColor(sTxt)
               .text(`STATUS: ${status}`, badgeX, badgeY + 3.5, { width: badgeW, align: 'center' });

            // Blue horizontal separator line
            y += 66;
            doc.moveTo(36, y).lineTo(559, y).lineWidth(2).strokeColor(colorPrimary).stroke();

            // ==========================================
            // 2. 4-COLUMN INVOICE META CARD
            // ==========================================
            y += 10;
            const metaCardH = 36;
            doc.roundedRect(36, y, 523, metaCardH, 4).fillAndStroke(colorGrayBg, colorBorder);

            const colW = 523 / 4;
            const renderMetaCol = (colIdx, label, val) => {
                const cx = 36 + (colIdx * colW) + 12;
                doc.fontSize(6.5).font('Helvetica-Bold').fillColor(colorMuted)
                   .text(label.toUpperCase(), cx, y + 7);
                doc.fontSize(9).font('Helvetica-Bold').fillColor(colorText)
                   .text(val, cx, y + 18);
            };

            renderMetaCol(0, 'Issue Date', invoice.date || new Date().toISOString().split('T')[0]);
            renderMetaCol(1, 'Payment Terms', invoice.paymentTerms || 'Due on Receipt');
            renderMetaCol(2, 'Due Date', invoice.dueDate || 'Upon Receipt');
            renderMetaCol(3, 'Currency', `${invoice.currency || 'USD'} (${symbol})`);

            // ==========================================
            // 3. ADDRESSES ROW: FROM & BILLED TO
            // ==========================================
            y += metaCardH + 10;
            const boxW = 256;
            const boxH = 92;

            // Box 1: Service Provider (From)
            doc.roundedRect(36, y, boxW, boxH, 4).fillAndStroke(colorCardBg, colorBorder);
            doc.fontSize(6.8).font('Helvetica-Bold').fillColor(colorMuted)
               .text('SERVICE PROVIDER (FROM)', 46, y + 8);
            doc.moveTo(46, y + 18).lineTo(36 + boxW - 10, y + 18).lineWidth(0.5).strokeColor('#f1f5f9').stroke();

            doc.fontSize(9.5).font('Helvetica-Bold').fillColor(colorText)
               .text('Abu Zannat', 46, y + 23);
            doc.fontSize(7.5).font('Helvetica').fillColor('#334155')
               .text(invoice.myAddress || 'Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh', 46, y + 36, { width: boxW - 20, lineGap: 1.5 });
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor(colorPrimary)
               .text('abuzannat911@gmail.com', 46, y + 74);

            // Box 2: Billed To (Client)
            const box2X = 303;
            doc.roundedRect(box2X, y, boxW, boxH, 4).fillAndStroke(colorCardBg, colorBorder);
            doc.fontSize(6.8).font('Helvetica-Bold').fillColor(colorMuted)
               .text('BILLED TO (CLIENT / ORGANIZATION)', box2X + 10, y + 8);
            doc.moveTo(box2X + 10, y + 18).lineTo(box2X + boxW - 10, y + 18).lineWidth(0.5).strokeColor('#f1f5f9').stroke();

            let cliY = y + 23;
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor(colorText)
               .text(invoice.clientName || 'Valued Client', box2X + 10, cliY);
            cliY += 12;

            if (invoice.clientCompany) {
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569')
                   .text(invoice.clientCompany, box2X + 10, cliY);
                cliY += 11;
            }
            if (invoice.clientEmail) {
                doc.fontSize(7.5).font('Helvetica').fillColor(colorPrimary)
                   .text(invoice.clientEmail, box2X + 10, cliY);
                cliY += 10;
            }
            if (invoice.clientPhone) {
                doc.fontSize(7.5).font('Helvetica').fillColor('#475569')
                   .text(`📞 ${invoice.clientPhone}`, box2X + 10, cliY);
                cliY += 10;
            }
            if (invoice.clientVat) {
                doc.fontSize(7.5).font('Helvetica-Bold').fillColor(colorDarkGreen)
                   .text(`VAT / Tax ID: ${invoice.clientVat}`, box2X + 10, cliY);
                cliY += 10;
            }
            if (invoice.clientAddress) {
                doc.fontSize(7.5).font('Helvetica').fillColor('#475569')
                   .text(invoice.clientAddress.replace(/\n/g, ', '), box2X + 10, cliY, { width: boxW - 20, lineGap: 1 });
            }

            // ==========================================
            // 4. LINE ITEMS TABLE
            // ==========================================
            y += boxH + 10;
            const tableW = 523;

            // Table Header Bar (matching screenshot light background)
            doc.roundedRect(36, y, tableW, 20, 3).fill('#f1f5f9');
            doc.rect(36, y, tableW, 20).stroke(colorBorder);

            doc.fontSize(7.2).font('Helvetica-Bold').fillColor('#334155')
               .text('SCOPE OF SERVICES / DELIVERABLES', 46, y + 6, { width: 280 })
               .text('QTY / HRS', 330, y + 6, { width: 50, align: 'center' })
               .text('UNIT RATE', 395, y + 6, { width: 70, align: 'right' })
               .text(`AMOUNT (${symbol})`, 475, y + 6, { width: 74, align: 'right' });

            y += 20;

            const items = Array.isArray(invoice.items) && invoice.items.length > 0
                ? invoice.items
                : [{ desc: 'WordPress Core & Plugin Bug Diagnostics', qty: 1, rate: totalVal || 150 }];

            items.forEach((item, idx) => {
                const qty = parseFloat(item.qty) || 1;
                const rate = parseFloat(item.rate) || 0;
                const amount = qty * rate;
                const rowH = 22;

                doc.rect(36, y, tableW, rowH).fillAndStroke(idx % 2 === 1 ? colorGrayBg : '#ffffff', colorBorder);

                doc.fontSize(8.5).font('Helvetica').fillColor(colorText)
                   .text(item.desc || 'WordPress Service', 46, y + 6, { width: 280 });
                doc.fontSize(8.5).font('Helvetica').fillColor(colorMuted)
                   .text(String(qty), 330, y + 6, { width: 50, align: 'center' });
                doc.fontSize(8.5).font('Helvetica').fillColor(colorMuted)
                   .text(`${symbol}${rate.toFixed(2)}`, 395, y + 6, { width: 70, align: 'right' });
                doc.fontSize(8.5).font('Helvetica-Bold').fillColor(colorText)
                   .text(`${symbol}${amount.toFixed(2)}`, 475, y + 6, { width: 74, align: 'right' });

                y += rowH;
            });

            // ==========================================
            // 5. TOTALS SUMMARY BOX (RIGHT-ALIGNED)
            // ==========================================
            y += 8;
            const totalsW = 200;
            const totalsX = 359;
            const totalsH = 58;

            doc.roundedRect(totalsX, y, totalsW, totalsH, 4).fillAndStroke(colorGrayBg, colorBorder);

            doc.fontSize(8).font('Helvetica').fillColor(colorMuted).text('Subtotal:', totalsX + 10, y + 7);
            doc.fontSize(8).font('Helvetica-Bold').fillColor(colorText).text(`${symbol}${subtotalVal.toFixed(2)}`, totalsX + 10, y + 7, { align: 'right', width: totalsW - 20 });

            doc.fontSize(8).font('Helvetica').fillColor(colorMuted).text('Tax / VAT (0% Non-US):', totalsX + 10, y + 20);
            doc.fontSize(8).font('Helvetica-Bold').fillColor(colorText).text(`${symbol}${taxAmountVal.toFixed(2)}`, totalsX + 10, y + 20, { align: 'right', width: totalsW - 20 });

            // Thick separator line
            doc.moveTo(totalsX + 10, y + 33).lineTo(totalsX + totalsW - 10, y + 33).lineWidth(1.5).strokeColor(colorText).stroke();

            doc.fontSize(10).font('Helvetica-Bold').fillColor(colorText).text('Total Due:', totalsX + 10, y + 40);
            doc.fontSize(11).font('Helvetica-Bold').fillColor(colorGreen).text(`${symbol}${totalVal.toFixed(2)}`, totalsX + 10, y + 39, { align: 'right', width: totalsW - 20 });

            y += totalsH + 10;

            // ==========================================
            // 6. INTERNATIONAL WIRE & BANKING INSTRUCTIONS (GREEN CARD)
            // ==========================================
            const bankH = 78;
            doc.roundedRect(36, y, 523, bankH, 4).fillAndStroke('#f0fdf4', '#bbf7d0');

            // Left dark green accent border bar
            doc.roundedRect(36, y, 4, bankH, 2).fill(colorDarkGreen);

            // Header line
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor(colorDarkGreen)
               .text('International Wire Transfer & Banking Instructions', 48, y + 8);

            // USA & EU Ready badge
            const euBadgeW = 75;
            doc.roundedRect(559 - euBadgeW - 8, y + 7, euBadgeW, 12, 6).fill('#dcfce7');
            doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#15803d')
               .text('USA & EU Ready', 559 - euBadgeW - 8, y + 9.5, { width: euBadgeW, align: 'center' });

            // Bank details columns
            const by1 = y + 22;
            const by2 = y + 37;

            const renderBankItem = (bx, by, label, val) => {
                doc.fontSize(6.2).font('Helvetica-Bold').fillColor(colorMuted).text(label.toUpperCase(), bx, by);
                doc.fontSize(8).font('Helvetica-Bold').fillColor(colorText).text(val, bx, by + 8);
            };

            renderBankItem(48, by1, 'Bank Name', invoice.bankName || 'Dutch Bangla Bank PLC');
            renderBankItem(180, by1, 'Beneficiary Holder', invoice.bankAccountName || 'Abu Zannat Md Mosaddek');
            renderBankItem(330, by1, 'Account # / IBAN', invoice.bankAccountNo || '1621010088950');
            renderBankItem(460, by1, 'Routing # (USA/ACH)', invoice.bankRouting || '090851456');

            renderBankItem(48, by2, 'Branch / Country', invoice.bankBranch || 'Rangpur Branch');
            renderBankItem(180, by2, 'SWIFT / BIC', invoice.bankSwift || 'DBBLBDDH');

            // Dashed separator line
            const dashY = y + 57;
            doc.moveTo(48, dashY).lineTo(549, dashY).lineWidth(0.5).strokeColor('#86efac').dash(3, { space: 2 }).stroke();
            doc.undash();

            doc.fontSize(7).font('Helvetica').fillColor(colorDarkGreen)
               .text('Wire Payment Reference: Quote ', 48, dashY + 5, { continued: true })
               .font('Helvetica-Bold').fillColor(colorText).text(invoice.number || 'INV-1001', { continued: true })
               .font('Helvetica').fillColor(colorDarkGreen).text(' in wire transfer description.');

            y += bankH + 8;

            // ==========================================
            // 7. INTERNATIONAL NOTICE COMPLIANCE BOX
            // ==========================================
            const noticeH = 24;
            doc.roundedRect(36, y, 523, noticeH, 4).fillAndStroke(colorGrayBg, colorBorder);
            doc.fontSize(6.8).font('Helvetica-Bold').fillColor('#334155')
               .text('International Notice: ', 44, y + 7, { continued: true })
               .font('Helvetica').fillColor(colorMuted)
               .text('• USA: Services rendered remotely outside US (Foreign Contractor, W-8BEN available).  • EU/UK: B2B Reverse Charge Mechanism (Art. 196, EU VAT Directive).', { width: 505 });

            y += noticeH + 8;

            // ==========================================
            // 8. SIGNOFF & FOOTER
            // ==========================================
            doc.moveTo(36, y).lineTo(559, y).lineWidth(0.5).strokeColor(colorBorder).stroke();
            y += 5;

            // Left
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor(colorText).text('Abu Zannat', 36, y);
            doc.fontSize(7).font('Helvetica').fillColor(colorMuted).text('WordPress Bug Fixer & Specialist Developer', 36, y + 10);

            // Right
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor(colorDarkGreen)
               .text('✔ Verified Electronic Commercial Invoice', 280, y, { align: 'right', width: 279 });
            doc.fontSize(7.5).font('Helvetica').fillColor(colorMuted)
               .text('Issued via Zannat.bd Engine', 280, y + 10, { align: 'right', width: 279 });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Generate full responsive HTML for Email matching the preview design exactly
 * @param {Object} invoice 
 * @param {string} customMessage 
 * @returns {string}
 */
function generateInvoiceEmailHtml(invoice, customMessage = '') {
    const currency = invoice.currency || 'USD';
    const symbol = getCurrencySymbol(currency);
    const totalVal = parseFloat(invoice.total) || 0;
    const subtotalVal = parseFloat(invoice.subtotal) || totalVal;
    const taxRateVal = parseFloat(invoice.taxRate) || 0;
    const taxAmountVal = parseFloat(invoice.taxAmount) || 0;
    const status = (invoice.status || 'Paid').toUpperCase();
    const isPaid = status === 'PAID';
    const isDue = status === 'DUE';
    const sBg = isPaid ? '#dcfce7' : (isDue ? '#fef3c7' : '#fee2e2');
    const sTxt = isPaid ? '#15803d' : (isDue ? '#b45309' : '#b91c1c');

    const items = Array.isArray(invoice.items) && invoice.items.length > 0
        ? invoice.items
        : [{ desc: 'WordPress Core & Plugin Bug Diagnostics', qty: 1, rate: totalVal || 150 }];

    let itemsRowsHtml = '';
    items.forEach((item, idx) => {
        const qty = parseFloat(item.qty) || 1;
        const rate = parseFloat(item.rate) || 0;
        const amount = qty * rate;
        const rowBg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
        itemsRowsHtml += `
            <tr style="background: ${rowBg};">
                <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; font-weight: 500;">${item.desc || 'WordPress Service'}</td>
                <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center;">${qty}</td>
                <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: right;">${symbol}${rate.toFixed(2)}</td>
                <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${symbol}${amount.toFixed(2)}</td>
            </tr>
        `;
    });

    const personalMessageHtml = customMessage ? `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px; font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-line;">
            ${customMessage}
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commercial Invoice ${invoice.number}</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 680px; margin: 0 auto;">
        ${personalMessageHtml}

        <!-- MAIN INVOICE CARD (MATCHING PREVIEW MODAL) -->
        <div style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; overflow: hidden; padding: 28px 32px;">
            
            <!-- Header Row -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
                <tr>
                    <td style="vertical-align: top;">
                        <div style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em;">Abu Zannat</div>
                        <div style="font-size: 13px; font-weight: 700; color: #6366f1; margin-top: 2px;">WordPress Specialist & Web Developer</div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Independent Contractor • Non-US Person • <a href="https://zannat.bd" style="color: #6366f1; text-decoration: none;">https://zannat.bd</a></div>
                    </td>
                    <td style="text-align: right; vertical-align: top;">
                        <div style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">COMMERCIAL INVOICE</div>
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">TAX INVOICE / EXPORT OF SERVICES</div>
                        <div style="font-size: 17px; font-weight: 800; color: #6366f1; margin-top: 3px;">${invoice.number}</div>
                        <div style="margin-top: 5px;">
                            <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 800; background: ${sBg}; color: ${sTxt};">STATUS: ${status}</span>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Blue Horizontal Bar -->
            <div style="height: 2px; background: #6366f1; margin-bottom: 18px;"></div>

            <!-- Meta Row Box -->
            <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 16px;">
                <tr>
                    <td style="padding: 10px 14px; width: 25%; border-right: 1px solid #e2e8f0;">
                        <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block;">Issue Date</span>
                        <strong style="font-size: 13px; color: #0f172a;">${invoice.date || 'Upon Receipt'}</strong>
                    </td>
                    <td style="padding: 10px 14px; width: 25%; border-right: 1px solid #e2e8f0;">
                        <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block;">Payment Terms</span>
                        <strong style="font-size: 13px; color: #0f172a;">${invoice.paymentTerms || 'Due on Receipt'}</strong>
                    </td>
                    <td style="padding: 10px 14px; width: 25%; border-right: 1px solid #e2e8f0;">
                        <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block;">Due Date</span>
                        <strong style="font-size: 13px; color: #0f172a;">${invoice.dueDate || 'Upon Receipt'}</strong>
                    </td>
                    <td style="padding: 10px 14px; width: 25%;">
                        <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; display: block;">Currency</span>
                        <strong style="font-size: 13px; color: #0f172a;">${invoice.currency} (${symbol})</strong>
                    </td>
                </tr>
            </table>

            <!-- Addresses Row -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
                <tr>
                    <td style="width: 50%; vertical-align: top; padding-right: 8px;">
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
                            <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.05em; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Service Provider (From)</div>
                            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">Abu Zannat</div>
                            <div style="font-size: 12px; color: #334155; line-height: 1.4; margin-top: 4px; white-space: pre-line;">${invoice.myAddress || 'Astha Building\nDorshona Mor, Rangpur City Bypass\nRangpur city, Rangpur\nBangladesh'}</div>
                            <div style="font-size: 12px; color: #6366f1; font-weight: 600; margin-top: 6px;">abuzannat911@gmail.com</div>
                        </div>
                    </td>
                    <td style="width: 50%; vertical-align: top; padding-left: 8px;">
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
                            <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.05em; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">Billed To (Client / Organization)</div>
                            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${invoice.clientName || 'Client'}</div>
                            ${invoice.clientCompany ? `<div style="font-size: 12px; font-weight: 700; color: #475569; margin-top: 2px;">${invoice.clientCompany}</div>` : ''}
                            ${invoice.clientEmail ? `<div style="font-size: 12px; color: #6366f1; margin-top: 3px;">${invoice.clientEmail}</div>` : ''}
                            ${invoice.clientPhone ? `<div style="font-size: 12px; color: #475569; margin-top: 3px;">📞 ${invoice.clientPhone}</div>` : ''}
                            ${invoice.clientVat ? `<div style="margin-top: 4px;"><span style="font-size: 11px; color: #166534; font-weight: 700; background: #f0fdf4; padding: 2px 6px; border-radius: 4px; border: 1px solid #bbf7d0;">VAT / Tax ID: ${invoice.clientVat}</span></div>` : ''}
                            ${invoice.clientAddress ? `<div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.4; white-space: pre-line;">${invoice.clientAddress}</div>` : ''}
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Scope of Services / Deliverables Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.04em;">Scope of Services / Deliverables</th>
                        <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; width: 15%;">Qty / Hrs</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; width: 20%;">Unit Rate</th>
                        <th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; width: 22%;">Amount (${symbol})</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRowsHtml}
                </tbody>
            </table>

            <!-- Totals Summary Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
                <tr>
                    <td></td>
                    <td style="width: 260px;">
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
                                <tr>
                                    <td style="padding: 3px 0;">Subtotal:</td>
                                    <td style="text-align: right; font-weight: 700; color: #0f172a;">${symbol}${subtotalVal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 3px 0;">Tax / VAT (0% Non-US):</td>
                                    <td style="text-align: right; font-weight: 700; color: #0f172a;">${symbol}${taxAmountVal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 4px;"></td>
                                </tr>
                                <tr>
                                    <td style="font-size: 15px; font-weight: 800; color: #0f172a;">Total Due:</td>
                                    <td style="text-align: right; font-size: 17px; font-weight: 900; color: #16a34a;">${symbol}${totalVal.toFixed(2)}</td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- International Wire Transfer & Banking Instructions Box -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #166534; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px;">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    <tr>
                        <td style="font-size: 13px; font-weight: 800; color: #166534;">
                            🏦 International Wire Transfer & Banking Instructions
                        </td>
                        <td style="text-align: right;">
                            <span style="font-size: 10px; font-weight: 700; background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 10px;">USA & EU Ready</span>
                        </td>
                    </tr>
                </table>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <tr>
                        <td style="padding: 3px 0; width: 50%;">
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Bank Name</span>
                            <strong style="color: #0f172a;">${invoice.bankName || 'Dutch Bangla Bank PLC'}</strong>
                        </td>
                        <td style="padding: 3px 0; width: 50%;">
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Beneficiary Holder</span>
                            <strong style="color: #0f172a;">${invoice.bankAccountName || 'Abu Zannat Md Mosaddek'}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 3px 0;">
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Account # / IBAN</span>
                            <strong style="color: #0f172a; font-family: monospace; font-size: 13px;">${invoice.bankAccountNo || '1621010088950'}</strong>
                        </td>
                        <td style="padding: 3px 0;">
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Routing # (USA/ACH)</span>
                            <strong style="color: #0f172a; font-family: monospace; font-size: 13px;">${invoice.bankRouting || '090851456'}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 3px 0;">
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Branch / Country</span>
                            <strong style="color: #0f172a;">${invoice.bankBranch || 'Rangpur Branch'}</strong>
                        </td>
                        <td style="padding: 3px 0;">
                            <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">SWIFT / BIC</span>
                            <strong style="color: #0f172a; font-family: monospace; font-size: 13px;">${invoice.bankSwift || 'DBBLBDDH'}</strong>
                        </td>
                    </tr>
                </table>
                <div style="font-size: 11px; color: #166534; margin-top: 10px; border-top: 1px dashed #86efac; padding-top: 6px;">
                    <strong>Wire Payment Reference:</strong> Quote <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 800; color: #0f172a;">${invoice.number}</code> in wire transfer description.
                </div>
            </div>

            <!-- International Notice Compliance Box -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #64748b; line-height: 1.4; margin-bottom: 14px;">
                <strong style="color: #334155;">International Notice:</strong>
                • <strong>USA:</strong> Services rendered remotely outside US (Foreign Contractor, W-8BEN available).
                • <strong>EU/UK:</strong> B2B Reverse Charge Mechanism (Art. 196, EU VAT Directive).
            </div>

            <!-- Footer & Verification -->
            <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 10px;">
                <tr>
                    <td style="font-size: 11px; color: #64748b;">
                        <strong style="color: #0f172a;">Abu Zannat</strong><br>
                        WordPress Bug Fixer & Specialist Developer
                    </td>
                    <td style="text-align: right; font-size: 11px;">
                        <span style="color: #166534; font-weight: 700;">✔ Verified Electronic Commercial Invoice</span><br>
                        <span style="color: #94a3b8; font-size: 10px;">Issued via Zannat.bd Engine</span>
                    </td>
                </tr>
            </table>

        </div>
    </div>
</body>
</html>
    `;
}

module.exports = {
    generateInvoicePDFBuffer,
    generateInvoiceEmailHtml,
    getCurrencySymbol
};
