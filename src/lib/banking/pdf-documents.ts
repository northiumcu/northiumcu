import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatHeadquartersAddress, institution } from "@/lib/institution";

const navy = rgb(0.031, 0.094, 0.153);
const gold = rgb(0.831, 0.651, 0.29);
const muted = rgb(0.4, 0.44, 0.52);
const text = rgb(0.043, 0.071, 0.125);

type StatementRow = {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
};

async function drawLetterhead(
  page: ReturnType<PDFDocument["addPage"]>,
  fonts: { bold: Awaited<ReturnType<PDFDocument["embedFont"]>>; regular: Awaited<ReturnType<PDFDocument["embedFont"]>> },
  title: string,
  subtitle?: string
) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 88, width, height: 88, color: navy });
  page.drawRectangle({ x: 0, y: height - 92, width, height: 4, color: gold });
  page.drawText(institution.name, {
    x: 48,
    y: height - 42,
    size: 16,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(institution.tagline, {
    x: 48,
    y: height - 58,
    size: 9,
    font: fonts.regular,
    color: rgb(0.85, 0.85, 0.85),
  });
  page.drawText(formatHeadquartersAddress(), {
    x: width - 280,
    y: height - 42,
    size: 8,
    font: fonts.regular,
    color: rgb(0.85, 0.85, 0.85),
  });
  page.drawText(institution.supportEmail, {
    x: width - 280,
    y: height - 54,
    size: 8,
    font: fonts.regular,
    color: rgb(0.85, 0.85, 0.85),
  });
  page.drawText(title, {
    x: 48,
    y: height - 118,
    size: 18,
    font: fonts.bold,
    color: text,
  });
  if (subtitle) {
    page.drawText(subtitle, {
      x: 48,
      y: height - 136,
      size: 10,
      font: fonts.regular,
      color: muted,
    });
  }
}

function drawFooter(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  pageNum: number,
  total: number
) {
  const { width } = page.getSize();
  page.drawLine({
    start: { x: 48, y: 48 },
    end: { x: width - 48, y: 48 },
    thickness: 0.5,
    color: rgb(0.85, 0.87, 0.9),
  });
  page.drawText(
    `${institution.name} · Member NCUA · This document is confidential.`,
    { x: 48, y: 32, size: 7, font, color: muted }
  );
  page.drawText(`Page ${pageNum} of ${total}`, {
    x: width - 100,
    y: 32,
    size: 7,
    font,
    color: muted,
  });
}

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
  const page = doc.addPage([612, 792]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  await drawLetterhead(page, { bold, regular }, "Transfer Confirmation", data.reference);

  let y = 620;
  const rows: [string, string][] = [
    ["Member", data.memberName],
    ["From Account", data.accountMask],
    ["Transfer Type", data.type.replace(/_/g, " ").toUpperCase()],
    ["Beneficiary", data.beneficiary],
    ["Amount", `$${data.amount.toFixed(2)}`],
    ["Status", data.status.toUpperCase()],
    ["Date", new Date(data.completedAt).toLocaleString()],
  ];
  if (data.memo) rows.push(["Memo", data.memo]);

  for (const [label, value] of rows) {
    page.drawText(label, { x: 48, y, size: 9, font: bold, color: muted });
    page.drawText(value, { x: 200, y, size: 10, font: regular, color: text });
    y -= 28;
  }

  page.drawRectangle({
    x: 48,
    y: y - 40,
    width: 516,
    height: 56,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: gold,
    borderWidth: 1,
  });
  page.drawText("This receipt confirms your authorized transfer.", {
    x: 64,
    y: y - 16,
    size: 9,
    font: regular,
    color: text,
  });
  page.drawText(`Questions? ${institution.supportEmail}`, {
    x: 64,
    y: y - 32,
    size: 8,
    font: regular,
    color: muted,
  });

  drawFooter(page, regular, 1, 1);
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
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([612, 792]);
  await drawLetterhead(
    page,
    { bold, regular },
    "Account Statement",
    `${data.periodLabel} · ${data.accountType}`
  );

  let y = 600;
  page.drawText(`Member: ${data.memberName}`, { x: 48, y, size: 10, font: regular, color: text });
  y -= 16;
  page.drawText(`Account: ${data.accountMask}`, { x: 48, y, size: 10, font: regular, color: text });
  y -= 24;
  page.drawText(`Opening Balance: $${data.openingBalance.toFixed(2)}`, {
    x: 48,
    y,
    size: 10,
    font: bold,
    color: text,
  });
  page.drawText(`Closing Balance: $${data.closingBalance.toFixed(2)}`, {
    x: 300,
    y,
    size: 10,
    font: bold,
    color: text,
  });
  y -= 32;

  page.drawRectangle({ x: 48, y: y - 4, width: 516, height: 20, color: navy });
  page.drawText("Date", { x: 56, y: y, size: 8, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Description", { x: 140, y: y, size: 8, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Amount", { x: 480, y: y, size: 8, font: bold, color: rgb(1, 1, 1) });
  y -= 22;

  for (const row of data.rows) {
    if (y < 80) break;
    const sign = row.type === "credit" ? "+" : "-";
    page.drawText(row.date, { x: 56, y, size: 8, font: regular, color: text });
    page.drawText(row.description.slice(0, 52), {
      x: 140,
      y,
      size: 8,
      font: regular,
      color: text,
    });
    page.drawText(`${sign}$${row.amount.toFixed(2)}`, {
      x: 470,
      y,
      size: 8,
      font: regular,
      color: row.type === "credit" ? rgb(0.1, 0.5, 0.3) : text,
    });
    y -= 16;
  }

  drawFooter(page, regular, 1, 1);
  return doc.save();
}
