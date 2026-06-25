import { PDFDocument, rgb } from "pdf-lib";
import { formatCurrency } from "@/lib/format/currency";
import { institution } from "@/lib/institution";
import {
  createPdfFonts,
  drawDetailPanel,
  drawFintechLetterhead,
  drawFooter,
  PDF_PAGE_SIZE,
  text,
  muted,
} from "@/lib/banking/pdf-letterhead";

type StatementRow = {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
};

export async function buildTransferReceiptPdf(data: {
  reference: string;
  memberName: string;
  accountMask: string;
  type: string;
  amount: number;
  beneficiary: string;
  status: string;
  completedAt: string;
  memo?: string | null;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage(PDF_PAGE_SIZE);
  const fonts = await createPdfFonts(doc);

  await drawFintechLetterhead(
    doc,
    page,
    fonts,
    "Transfer Confirmation",
    `Reference ${data.reference}`
  );

  const rows: [string, string][] = [
    ["Member", data.memberName],
    ["From Account", data.accountMask],
    ["Transfer Type", data.type.replace(/_/g, " ").toUpperCase()],
    ["Beneficiary", data.beneficiary],
    ["Amount", formatCurrency(data.amount)],
    ["Status", data.status.toUpperCase()],
    ["Completed", new Date(data.completedAt).toLocaleString()],
  ];
  if (data.memo) rows.push(["Memo", data.memo]);

  const noteY = drawDetailPanel(page, fonts, rows, 580);

  page.drawRectangle({
    x: 40,
    y: noteY - 72,
    width: 532,
    height: 64,
    color: rgb(0.96, 0.98, 1),
    borderColor: rgb(0.83, 0.65, 0.29),
    borderWidth: 1,
  });
  page.drawText("Authorized transfer receipt", {
    x: 56,
    y: noteY - 28,
    size: 10,
    font: fonts.bold,
    color: text,
  });
  page.drawText(
    "This document confirms your authorized transfer. Retain for your records.",
    { x: 56, y: noteY - 44, size: 9, font: fonts.regular, color: muted }
  );
  page.drawText(`Questions? ${institution.supportEmail}`, {
    x: 56,
    y: noteY - 58,
    size: 8,
    font: fonts.regular,
    color: muted,
  });

  drawFooter(page, fonts.regular, 1, 1);
  return doc.save();
}

export async function buildStatementPdf(data: {
  memberName: string;
  accountMask: string;
  accountType: string;
  periodLabel: string;
  openingBalance: number;
  closingBalance: number;
  rows: StatementRow[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await createPdfFonts(doc);

  const rowsPerPage = 28;
  const totalPages = Math.max(1, Math.ceil(data.rows.length / rowsPerPage) || 1);
  let rowIndex = 0;

  for (let pageNum = 0; pageNum < totalPages; pageNum += 1) {
    const page = doc.addPage(PDF_PAGE_SIZE);
    const { width } = page.getSize();

    await drawFintechLetterhead(
      doc,
      page,
      fonts,
      "Account Statement",
      `${data.periodLabel} · ${data.accountType.replace(/_/g, " ")}`
    );

    let y = 560;
    if (pageNum === 0) {
      const summaryRows: [string, string][] = [
        ["Member", data.memberName],
        ["Account", data.accountMask],
        ["Period", data.periodLabel],
        ["Opening Balance", formatCurrency(data.openingBalance)],
        ["Closing Balance", formatCurrency(data.closingBalance)],
      ];
      y = drawDetailPanel(page, fonts, summaryRows, 560) - 8;
    }

    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 22, color: rgb(0.031, 0.094, 0.153) });
    page.drawText("Date", { x: 52, y: y + 2, size: 8, font: fonts.bold, color: rgb(1, 1, 1) });
    page.drawText("Description", { x: 130, y: y + 2, size: 8, font: fonts.bold, color: rgb(1, 1, 1) });
    page.drawText("Type", { x: 400, y: y + 2, size: 8, font: fonts.bold, color: rgb(1, 1, 1) });
    page.drawText("Amount", { x: 480, y: y + 2, size: 8, font: fonts.bold, color: rgb(1, 1, 1) });
    y -= 24;

    const pageRows = data.rows.slice(rowIndex, rowIndex + rowsPerPage);
    rowIndex += pageRows.length;

    for (const row of pageRows) {
      if (y < 72) break;
      const sign = row.type === "credit" ? "+" : "-";
      page.drawText(row.date, { x: 52, y, size: 8, font: fonts.regular, color: text });
      page.drawText(row.description.slice(0, 48), {
        x: 130,
        y,
        size: 8,
        font: fonts.regular,
        color: text,
      });
      page.drawText(row.type === "credit" ? "Credit" : "Debit", {
        x: 400,
        y,
        size: 8,
        font: fonts.regular,
        color: muted,
      });
      page.drawText(`${sign}${formatCurrency(row.amount)}`, {
        x: 468,
        y,
        size: 8,
        font: fonts.bold,
        color: row.type === "credit" ? rgb(0.1, 0.5, 0.3) : text,
      });
      y -= 18;
    }

    drawFooter(page, fonts.regular, pageNum + 1, totalPages);
  }

  return doc.save();
}
