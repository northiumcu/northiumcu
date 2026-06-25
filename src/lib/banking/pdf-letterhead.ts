import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { formatHeadquartersAddress, institution } from "@/lib/institution";

const navy = rgb(0.031, 0.094, 0.153);
const navyDeep = rgb(0.02, 0.06, 0.11);
const gold = rgb(0.831, 0.651, 0.29);
const goldSoft = rgb(0.92, 0.82, 0.62);
const muted = rgb(0.42, 0.46, 0.54);
const text = rgb(0.043, 0.071, 0.125);
const white = rgb(1, 1, 1);
const panel = rgb(0.97, 0.98, 0.995);

export const PDF_PAGE_SIZE: [number, number] = [612, 792];

export type PdfFonts = {
  bold: PDFFont;
  regular: PDFFont;
};

export async function createPdfFonts(doc: PDFDocument): Promise<PdfFonts> {
  return {
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    regular: await doc.embedFont(StandardFonts.Helvetica),
  };
}

async function embedBrandLogo(doc: PDFDocument) {
  const logoPath = path.join(process.cwd(), "src/app/icon.png");
  if (!fs.existsSync(logoPath)) return null;
  const bytes = fs.readFileSync(logoPath);
  return doc.embedPng(bytes);
}

export async function drawFintechLetterhead(
  doc: PDFDocument,
  page: PDFPage,
  fonts: PdfFonts,
  title: string,
  subtitle?: string
) {
  const { width, height } = page.getSize();
  const logo = await embedBrandLogo(doc);

  page.drawRectangle({ x: 0, y: height - 128, width, height: 128, color: navyDeep });
  page.drawRectangle({
    x: 0,
    y: height - 132,
    width,
    height: 4,
    color: gold,
  });
  page.drawRectangle({
    x: 0,
    y: height - 136,
    width,
    height: 2,
    color: goldSoft,
  });

  const logoSize = 52;
  const logoX = 48;
  const logoY = height - 108;

  if (logo) {
    page.drawImage(logo, {
      x: logoX,
      y: logoY,
      width: logoSize,
      height: logoSize,
    });
  } else {
    page.drawRectangle({
      x: logoX,
      y: logoY,
      width: logoSize,
      height: logoSize,
      color: gold,
    });
    page.drawText("N", {
      x: logoX + 18,
      y: logoY + 16,
      size: 22,
      font: fonts.bold,
      color: navyDeep,
    });
  }

  const textX = logo ? logoX + logoSize + 16 : logoX + logoSize + 16;
  page.drawText(institution.name, {
    x: textX,
    y: height - 72,
    size: 18,
    font: fonts.bold,
    color: white,
  });
  page.drawText(institution.tagline, {
    x: textX,
    y: height - 90,
    size: 9,
    font: fonts.regular,
    color: rgb(0.78, 0.84, 0.9),
  });
  page.drawText("Member Banking · Secure Digital Channel", {
    x: textX,
    y: height - 104,
    size: 8,
    font: fonts.regular,
    color: rgb(0.62, 0.7, 0.78),
  });

  const rightX = width - 220;
  page.drawText(formatHeadquartersAddress(), {
    x: rightX,
    y: height - 72,
    size: 8,
    font: fonts.regular,
    color: rgb(0.78, 0.84, 0.9),
  });
  page.drawText(institution.supportEmail, {
    x: rightX,
    y: height - 86,
    size: 8,
    font: fonts.regular,
    color: rgb(0.78, 0.84, 0.9),
  });
  page.drawText(institution.productionUrl.replace("https://", ""), {
    x: rightX,
    y: height - 100,
    size: 8,
    font: fonts.regular,
    color: goldSoft,
  });

  page.drawRectangle({
    x: 40,
    y: height - 168,
    width: width - 80,
    height: 44,
    color: panel,
    borderColor: rgb(0.9, 0.92, 0.95),
    borderWidth: 1,
  });
  page.drawText(title, {
    x: 56,
    y: height - 148,
    size: 20,
    font: fonts.bold,
    color: navy,
  });
  if (subtitle) {
    page.drawText(subtitle, {
      x: 56,
      y: height - 164,
      size: 10,
      font: fonts.regular,
      color: muted,
    });
  }
}

export function drawDetailPanel(
  page: PDFPage,
  fonts: PdfFonts,
  rows: [string, string][],
  startY: number
) {
  const { width } = page.getSize();
  const panelHeight = rows.length * 34 + 36;
  const panelY = startY - panelHeight;

  page.drawRectangle({
    x: 40,
    y: panelY,
    width: width - 80,
    height: panelHeight,
    color: white,
    borderColor: rgb(0.88, 0.9, 0.94),
    borderWidth: 1,
  });
  page.drawRectangle({
    x: 40,
    y: panelY + panelHeight - 6,
    width: width - 80,
    height: 6,
    color: gold,
  });

  let y = startY - 28;
  for (const [label, value] of rows) {
    page.drawText(label.toUpperCase(), {
      x: 56,
      y,
      size: 7,
      font: fonts.bold,
      color: muted,
    });
    page.drawText(value, {
      x: 200,
      y,
      size: 11,
      font: fonts.regular,
      color: text,
    });
    y -= 34;
  }

  return panelY - 24;
}

export function drawFooter(
  page: PDFPage,
  font: PDFFont,
  pageNum: number,
  total: number
) {
  const { width } = page.getSize();
  const footerHeight = 56;
  page.drawRectangle({ x: 0, y: 0, width, height: footerHeight, color: navyDeep });
  page.drawRectangle({ x: 0, y: footerHeight, width, height: 2, color: gold });
  page.drawText(
    `${institution.name} · NCUA Insured · Confidential member document`,
    { x: 48, y: 22, size: 7, font, color: rgb(0.75, 0.8, 0.86) }
  );
  page.drawText(`Page ${pageNum} of ${total}`, {
    x: width - 88,
    y: 22,
    size: 7,
    font,
    color: rgb(0.75, 0.8, 0.86),
  });
}

export { navy, gold, muted, text, white, panel };
