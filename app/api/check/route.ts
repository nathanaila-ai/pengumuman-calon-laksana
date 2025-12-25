import { NextResponse } from "next/server";
import { fetchSheetValues } from "@/lib/sheets";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nim = (searchParams.get("nim") || "").trim();

    if (!nim) {
      return NextResponse.json({ ok: false, message: "NIM wajib diisi." }, { status: 400 });
    }

    const rows = await fetchSheetValues();
    if (rows.length < 2) {
      return NextResponse.json({ ok: false, message: "Data belum tersedia." }, { status: 500 });
    }

    const header = rows[0].map((h) => String(h || "").trim());
    const dataRows = rows.slice(1);

    const idx = (name: string) =>
      header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

    const iNIM = idx("NIM");
    const iNama = idx("Nama");
    const iFak = idx("Fakultas");
    const iBiro = idx("Biro/Departemen");
    const iStatus = idx("Status");
    const iNHNama = idx("Narahubung_Nama");
    const iNHWA = idx("Narahubung_WA");
    const iNHLine = idx("Narahubung_Line");
    const iCatatan = idx("Catatan");

    if (iNIM === -1) {
      return NextResponse.json({ ok: false, message: "Kolom NIM tidak ditemukan di header." }, { status: 500 });
    }

    const row = dataRows.find((r) => String(r[iNIM] || "").trim() === nim);

    if (!row) {
      return NextResponse.json({ ok: false, message: "NIM tidak ditemukan. Pastikan NIM benar." });
    }

    const data = {
      nim: String(row[iNIM] || "").trim(),
      nama: String(row[iNama] || "").trim(),
      fakultas: String(row[iFak] || "").trim(),
      biro: String(row[iBiro] || "").trim(),
      status: String(row[iStatus] || "").trim(),
      narahubungNama: String(row[iNHNama] || "").trim(),
      narahubungWA: String(row[iNHWA] || "").trim(),
      narahubungLine: String(row[iNHLine] || "").trim(),
      catatan: String(row[iCatatan] || "").trim(),
    };

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: `Error server: ${err.message}` },
      { status: 500 }
    );
  }
}
