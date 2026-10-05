import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { Download, FileImage, FileText } from "lucide-react";
import { centsToUSD, type Order } from "../api/client";
import { toast } from "./Layout";

const COMPANY = {
  name: "BrandingPulse",
  tagline: "Logo & Brand Identity",
  email: "admin@brandingpulse.co",
  wa: "wa.me/6281241525485",
  web: "brandingpulse.co",
};

function d(iso?: string | null) {
  return (iso ?? "").slice(0, 10) || "—";
}

function briefText(o: Order): { business: string; notes: string } {
  const b = o.brief as any;
  if (b && typeof b === "object") {
    return { business: String(b.business ?? ""), notes: String(b.notes ?? "") };
  }
  return { business: "", notes: typeof o.brief === "string" ? o.brief : "" };
}

function fileName(o: Order, ext: string) {
  return `Invoice-LP-${o.id.slice(0, 8).toUpperCase()}.${ext}`;
}

function buildPdf(o: Order) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  let y = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 55, 56);
  doc.text(COMPANY.name, 14, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(COMPANY.tagline, 14, y + 5);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20);
  doc.text("INVOICE", W - 14, y, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`#LP-${o.id.slice(0, 8).toUpperCase()}`, W - 14, y + 6, { align: "right" });
  y += 14;
  doc.setDrawColor(220);
  doc.line(14, y, W - 14, y);
  y += 8;

  const left: [string, string][] = [
    ["Billed to", `${o.customer_name}`],
    ["", `${o.customer_email || "—"}`],
    ["", `${o.customer_phone || "—"}`],
  ];
  const right: [string, string][] = [
    ["Issue date", d(o.created_at)],
    ["Paid date", d(o.paid_at)],
    ["Status", String(o.status).replace(/_/g, " ").toUpperCase()],
  ];
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("BILLED TO", 14, y);
  doc.text("DETAILS", 120, y);
  y += 5;
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text(o.customer_name || "—", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Issue date: ${d(o.created_at)}`, 120, y);
  y += 5;
  doc.text(o.customer_email || "—", 14, y);
  doc.text(`Paid date:  ${d(o.paid_at)}`, 120, y);
  y += 5;
  doc.text(o.customer_phone || "—", 14, y);
  doc.text(`Status:    ${String(o.status).replace(/_/g, " ").toUpperCase()}`, 120, y);
  y += 5;
  void left;
  void right;
  y += 4;
  doc.setFillColor(15, 55, 56);
  doc.rect(14, y, W - 28, 8, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 16, y + 5.5);
  doc.text("AMOUNT", W - 16, y + 5.5, { align: "right" });
  y += 8;
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  const { business, notes } = briefText(o);
  doc.text(`Logo & brand identity — ${o.tier} package`, 16, y + 5.5);
  doc.text(centsToUSD(o.total_cents), W - 16, y + 5.5, { align: "right" });
  y += 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100);
  if (business) {
    const lines = doc.splitTextToSize(`Business: ${business}`, W - 32);
    doc.text(lines, 16, y);
    y += lines.length * 4;
  }
  if (notes) {
    const lines = doc.splitTextToSize(`Customer notes: ${notes}`, W - 32);
    doc.text(lines, 16, y);
    y += lines.length * 4;
  }
  y += 2;
  doc.setDrawColor(220);
  doc.line(14, y, W - 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Subtotal", 130, y);
  doc.setTextColor(20);
  doc.text(centsToUSD(o.total_cents), W - 16, y, { align: "right" });
  y += 6;
  doc.setTextColor(100);
  doc.text("Discount", 130, y);
  doc.setTextColor(20);
  doc.text("$0.00", W - 16, y, { align: "right" });
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total (USD)", 130, y);
  doc.text(centsToUSD(o.total_cents), W - 16, y, { align: "right" });
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("PAYMENT", 14, y);
  y += 5;
  doc.setTextColor(20);
  const payLines = doc.splitTextToSize(
    `Method: manual bank transfer arranged over WhatsApp${o.payment_proof ? ` — proof on file` : ""}`,
    W - 28
  );
  doc.text(payLines, 14, y);
  y += payLines.length * 4.5 + 3;
  doc.setFontSize(8.5);
  doc.setTextColor(120);
  const thanks = doc.splitTextToSize(
    "Thank you for trusting BrandingPulse. First concepts within 48 hours of payment. 100% money-back guarantee.",
    W - 28
  );
  doc.text(thanks, 14, 288);
  doc.setFontSize(8);
  doc.text(`${COMPANY.email}  ·  ${COMPANY.wa}  ·  ${COMPANY.web}`, W / 2, 294, { align: "center" });
  return doc;
}

export default function OrderInvoice({ order: o }: { order: Order }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const { business, notes } = briefText(o);

  const downloadPdf = () => {
    try {
      setBusy("pdf");
      buildPdf(o).save(fileName(o, "pdf"));
      toast("Invoice PDF downloaded");
    } catch {
      toast("PDF failed");
    } finally {
      setBusy(null);
    }
  };

  const downloadPng = async () => {
    if (!ref.current) return;
    try {
      setBusy("png");
      const url = await toPng(ref.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName(o, "png");
      a.click();
      toast("Invoice image downloaded");
    } catch {
      toast("Image failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 rounded-[16px] ring-1 ring-[#e2eceb]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2eceb] px-4 py-3">
        <p className="text-sm font-bold text-ink-primary">Invoice #LP-{o.id.slice(0, 8).toUpperCase()}</p>
        <div className="flex gap-2">
          <button className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs" disabled={busy !== null} onClick={downloadPdf}>
            <FileText className="h-3.5 w-3.5" /> {busy === "pdf" ? "…" : "PDF"}
          </button>
          <button className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs" disabled={busy !== null} onClick={() => void downloadPng()}>
            <FileImage className="h-3.5 w-3.5" /> {busy === "png" ? "…" : "Image"}
          </button>
        </div>
      </div>
      <div ref={ref} className="bg-white p-5 text-sm text-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-extrabold text-[#0f3738]">{COMPANY.name}</p>
            <p className="text-xs text-slate-500">{COMPANY.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold">INVOICE</p>
            <p className="tabular text-xs text-slate-500">#LP-{o.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-xs">
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400">Billed to</p>
            <p className="mt-1 font-bold text-slate-900">{o.customer_name}</p>
            <p className="text-slate-500">{o.customer_email || "—"}</p>
            <p className="text-slate-500">{o.customer_phone || "—"}</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-slate-400">Details</p>
            <p className="tabular mt-1">Issue: {d(o.created_at)}</p>
            <p className="tabular">Paid: {d(o.paid_at)}</p>
            <p className="capitalize">Status: {String(o.status).replace(/_/g, " ")}</p>
          </div>
        </div>
        <table className="mt-4 w-full text-xs">
          <thead>
            <tr className="bg-[#0f3738] text-left text-white">
              <th className="px-3 py-2 font-bold">Description</th>
              <th className="px-3 py-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-3 py-2">
                <p className="font-bold">Logo &amp; brand identity — <span className="capitalize">{o.tier}</span> package</p>
                {business && <p className="mt-0.5 text-slate-500">Business: {business}</p>}
                {notes && <p className="mt-0.5 text-slate-500">Notes: {notes}</p>}
              </td>
              <td className="tabular px-3 py-2 text-right font-bold">{centsToUSD(o.total_cents)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-2 space-y-1 text-right text-xs">
          <p className="text-slate-500">Subtotal: <span className="tabular font-semibold text-slate-800">{centsToUSD(o.total_cents)}</span></p>
          <p className="text-slate-500">Discount: <span className="tabular font-semibold text-slate-800">$0.00</span></p>
          <p className="text-base font-extrabold">Total (USD): {centsToUSD(o.total_cents)}</p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Payment: manual bank transfer arranged over WhatsApp{o.payment_proof ? " — proof on file" : ""}.
        </p>
        <p className="mt-3 border-t border-slate-200 pt-2 text-center text-[11px] text-slate-400">
          Thank you for trusting BrandingPulse. First concepts within 48 hours of payment. 100% money-back guarantee.<br />
          {COMPANY.email} · {COMPANY.wa} · {COMPANY.web}
        </p>
      </div>
    </div>
  );
}

export function DownloadIcon() {
  return <Download className="h-3.5 w-3.5" />;
}
