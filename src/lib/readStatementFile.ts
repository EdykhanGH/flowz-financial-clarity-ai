// Turns uploaded statement files into transactions.
// Excel and CSV are read on the phone. PDFs are split into a few pages at a time and read by AI,
// so a long statement doesn't make one slow request. Photos and screenshots are read by AI too.

import { readStatementPart } from "@/lib/api";
import { parseCsv, readStatementRows, type ReadStatement, type StatementTxn } from "./bankStatement";
import type { Currency } from "./parse";

/** A problem worth showing to the user as it is. */
export class StatementError extends Error {}

const PAGES_PER_PART = 4;
const PARALLEL = 3;
const MAX_FILE = 10 * 1024 * 1024;

function kindOf(file: File): "csv" | "xlsx" | "xls" | "pdf" | "image" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") return "csv";
  if (name.endsWith(".xlsx")) return "xlsx";
  if (name.endsWith(".xls")) return "xls";
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Runs tasks a few at a time, keeping results in order. */
async function inBatches<T>(tasks: (() => Promise<T>)[], size: number, onDone: () => void): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      out[i] = await tasks[i]();
      onDone();
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, tasks.length) }, worker));
  return out;
}

/** Photos from a phone camera can be large; the AI reads a 2000px image just as well. */
async function shrinkImage(file: File): Promise<{ data: string; type: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.size < 3.5 * 1024 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { data: toBase64(bytes), type: file.type };
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) throw new StatementError("Flowz couldn't open this picture. Try a screenshot or a PDF.");
  return { data: toBase64(new Uint8Array(await blob.arrayBuffer())), type: "image/jpeg" };
}

async function pdfParts(file: File): Promise<{ data: string; pages: number }[]> {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let doc;
  try {
    doc = await PDFDocument.load(bytes);
  } catch (err) {
    if (/encrypt/i.test(String((err as Error)?.message ?? err))) {
      throw new StatementError(
        "This PDF is locked with a password. Download the statement again from your bank app without a password, or upload the Excel version.",
      );
    }
    throw new StatementError("Flowz couldn't open this PDF. Try downloading the statement again.");
  }
  const total = doc.getPageCount();
  if (total <= PAGES_PER_PART) return [{ data: toBase64(bytes), pages: total }];
  const parts: { data: string; pages: number }[] = [];
  for (let start = 0; start < total; start += PAGES_PER_PART) {
    const part = await PDFDocument.create();
    const indices = Array.from({ length: Math.min(PAGES_PER_PART, total - start) }, (_, i) => start + i);
    for (const page of await part.copyPages(doc, indices)) part.addPage(page);
    parts.push({ data: toBase64(await part.save()), pages: indices.length });
  }
  return parts;
}

async function readWithAI(parts: { data: string; type: string; pages: number }[], today: string, onProgress?: (done: number, total: number) => void) {
  let done = 0;
  onProgress?.(0, parts.length);
  const results = await inBatches(
    parts.map((p) => () => readStatementPart(p.data, p.type, p.pages, today)),
    PARALLEL,
    () => onProgress?.(++done, parts.length),
  );
  const readable = results.filter((r) => r.readable);
  if (!readable.length) throw new StatementError(results[0]?.problem || "Flowz couldn't find any transactions in this file.");
  const transactions: StatementTxn[] = readable.flatMap((r) =>
    r.transactions.map((t) => ({
      txn_date: t.date,
      amount: Math.round(t.amount * 100) / 100,
      direction: t.direction,
      description: t.description.replace(/\s+/g, " ").trim(),
      balance: t.balance,
    })),
  );
  const usd = readable.filter((r) => r.currency === "USD").length;
  return {
    bank_name: readable.find((r) => r.bank_name)?.bank_name ?? null,
    currency: (usd > readable.length / 2 ? "USD" : "NGN") as Currency,
    transactions,
  };
}

/** Reads one or more files (e.g. a PDF, or several screenshots) into one list of transactions. */
export async function readStatementFiles(files: File[], today: string, onProgress?: (done: number, total: number) => void): Promise<ReadStatement> {
  if (!files.length) throw new StatementError("Choose a statement file first.");
  for (const f of files) {
    if (f.size > MAX_FILE) throw new StatementError(`${f.name} is too big. Try a statement for one month.`);
    const kind = kindOf(f);
    if (kind === "xls") throw new StatementError("This is an old Excel file (.xls). Open it and save it as .xlsx, or download the PDF statement instead.");
    if (!kind) throw new StatementError(`Flowz can't read ${f.name}. Upload a PDF, an Excel (.xlsx) or CSV file, or a screenshot.`);
  }

  // Spreadsheets: read on the phone.
  if (files.length === 1 && ["csv", "xlsx"].includes(kindOf(files[0])!)) {
    const file = files[0];
    let rows: unknown[][];
    if (kindOf(file) === "csv") rows = parseCsv(await file.text());
    else {
      const { default: readXlsxFile } = await import("read-excel-file");
      rows = (await readXlsxFile(file)) as unknown[][];
    }
    const read = readStatementRows(rows);
    if (!read) throw new StatementError("Flowz couldn't find the date and amount columns in this file. Try the PDF version of your statement.");
    return read;
  }
  if (files.some((f) => ["csv", "xlsx"].includes(kindOf(f)!))) {
    throw new StatementError("Upload a spreadsheet on its own. PDFs and screenshots can be uploaded together.");
  }

  // PDFs and pictures: read by AI, a few pages at a time. The demo has no AI.
  if (import.meta.env.MODE === "demo") {
    throw new StatementError("The demo reads Excel and CSV statements, or tap “Try a sample statement”. The real app also reads PDFs and screenshots.");
  }
  const parts: { data: string; type: string; pages: number }[] = [];
  for (const f of files) {
    if (kindOf(f) === "pdf") parts.push(...(await pdfParts(f)).map((p) => ({ ...p, type: "application/pdf" })));
    else {
      const img = await shrinkImage(f);
      parts.push({ data: img.data, type: img.type, pages: 1 });
    }
  }
  return readWithAI(parts, today, onProgress);
}
