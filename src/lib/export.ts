import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export type RecapRow = {
  studentName: string;
  className: string;
  status: string;
  attendedAt: string;
  confidence?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function exportToExcel(rows: RecapRow[], filename = "rekap-absensi.xlsx") {
  const sheet = XLSX.utils.json_to_sheet(rows.map((r) => ({
    Nama: r.studentName,
    Kelas: r.className,
    Status: r.status,
    "Waktu Absen": r.attendedAt,
    Confidence: r.confidence ?? "",
    Latitude: r.latitude ?? "",
    Longitude: r.longitude ?? "",
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Rekap");
  XLSX.writeFile(wb, filename);
}

export function exportToPDF(rows: RecapRow[], title = "Rekap Absensi") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  let y = 25;
  doc.text("Nama", 14, y);
  doc.text("Kelas", 70, y);
  doc.text("Status", 110, y);
  doc.text("Waktu Absen", 145, y);
  doc.text("Confidence", 230, y);
  y += 6;
  rows.forEach((r) => {
    doc.text((r.studentName ?? "-").slice(0, 28), 14, y);
    doc.text((r.className ?? "-").slice(0, 18), 70, y);
    doc.text((r.status ?? "-").slice(0, 14), 110, y);
    doc.text((r.attendedAt ?? "-").slice(0, 32), 145, y);
    doc.text(typeof r.confidence === "number" ? `${r.confidence.toFixed(2)}%` : "-", 230, y);
    y += 6;
    if (y > 190) { doc.addPage(); y = 15; }
  });
  doc.save("rekap-absensi.pdf");
}
