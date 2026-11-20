"""
generate_documentation.py
Generates DOKUMENTASI_REKAP_KAS_XI_PPLG_2.docx
Requires: pip install python-docx
"""

from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hex(hex_str: str) -> RGBColor:
    h = hex_str.lstrip("#")
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def set_cell_bg(cell, hex_color: str):
    """Fill a table cell with a solid background colour."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color.lstrip("#"))
    tcPr.append(shd)


def set_cell_border(cell, **kwargs):
    """Apply thin borders to a table cell. kwargs: top, bottom, left, right (hex color string)."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for side in ("top", "left", "bottom", "right"):
        color = kwargs.get(side, "D1D5DB")
        border = OxmlElement(f"w:{side}")
        border.set(qn("w:val"), "single")
        border.set(qn("w:sz"), "4")
        border.set(qn("w:space"), "0")
        border.set(qn("w:color"), color.lstrip("#"))
        tcBorders.append(border)
    tcPr.append(tcBorders)


def set_cell_margins(cell, top=60, bottom=60, left=100, right=100):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement("w:tcMar")
    for side, val in (("top", top), ("bottom", bottom), ("left", left), ("right", right)):
        m = OxmlElement(f"w:{side}")
        m.set(qn("w:w"), str(val))
        m.set(qn("w:type"), "dxa")
        tcMar.append(m)
    tcPr.append(tcMar)


def para(doc, text="", bold=False, size=11, align=WD_ALIGN_PARAGRAPH.LEFT,
         color="#1F2937", space_before=0, space_after=6, italic=False, font_name="Arial"):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    if text:
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.size = Pt(size)
        run.font.name = font_name
        run.font.color.rgb = _hex(color)
    return p


def divider(doc):
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), "E5E7EB")
    pBdr.append(bottom)
    pPr.append(pBdr)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)


def screenshot_placeholder(doc, label: str, caption: str, figure_num: int):
    """Draw a dashed-border placeholder box for a screenshot + caption."""
    # Dashed box via a 1-cell table
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)

    # Dashed border
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for side in ("top", "left", "bottom", "right"):
        b = OxmlElement(f"w:{side}")
        b.set(qn("w:val"), "dashDot")
        b.set(qn("w:sz"), "12")
        b.set(qn("w:space"), "0")
        b.set(qn("w:color"), "6B7280")
        tcBorders.append(b)
    tcPr.append(tcBorders)

    set_cell_bg(cell, "F9FAFB")

    cell.width = Cm(15)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(30)
    p.paragraph_format.space_after = Pt(30)
    icon = p.add_run("[ Screenshot Placeholder ]\n")
    icon.font.size = Pt(12)
    icon.font.color.rgb = _hex("#9CA3AF")
    icon.font.name = "Arial"
    lbl = p.add_run(label)
    lbl.font.size = Pt(10)
    lbl.font.color.rgb = _hex("#6B7280")
    lbl.font.name = "Arial"

    doc.add_paragraph()  # small spacer

    # Figure caption
    cap_p = doc.add_paragraph()
    cap_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap_p.paragraph_format.space_before = Pt(2)
    cap_p.paragraph_format.space_after = Pt(14)
    num_run = cap_p.add_run(f"Gambar {figure_num}. ")
    num_run.bold = True
    num_run.font.size = Pt(10)
    num_run.font.name = "Arial"
    num_run.font.color.rgb = _hex("#1E3A8A")
    cap_run = cap_p.add_run(caption)
    cap_run.font.size = Pt(10)
    cap_run.font.name = "Arial"
    cap_run.font.color.rgb = _hex("#374151")


def build_test_table(doc):
    HEADERS = [
        "No.", "ID Tes", "Modul", "Skenario Pengujian",
        "Langkah-langkah", "Data Uji",
        "Hasil yang Diharapkan", "Hasil Aktual"
    ]
    COL_WIDTHS_CM = [0.8, 1.6, 2.2, 3.5, 3.5, 2.8, 4.0, 1.6]

    ROWS = [
        ("1", "NAV-001", "Navigation Bar",
         "Navigasi 'Kembali ke Beranda' di Dashboard Bendahara",
         "Klik tombol 'Kembali ke Beranda' pada header dashboard",
         "Route: route('home')",
         "Browser berpindah ke Landing Page Pelajar tanpa memutus sesi login bendahara",
         "✅ Lulus"),
        ("2", "PAG-001", "Pagination",
         "Navigasi Halaman Transaksi Kas",
         "Klik tombol 'Next' atau nomor halaman '2' pada kontrol pagination",
         "25 Total Records, limit 10/page",
         "Tabel memperbarui daftar mutasi baris 11-20 via Inertia preserveScroll tanpa reload halaman penuh",
         "✅ Lulus"),
        ("3", "TRM-001", "Form Preset",
         "Input Pemasukan Tak Terduga (Denda Kas)",
         "Pilih opsi preset 'Denda', isi nominal Rp5.000, klik Simpan",
         "Kategori: Denda, Nominal: 5000",
         "Mutasi tercatat otomatis sebagai tipe 'masuk' dan total saldo kas bertambah Rp5.000",
         "✅ Lulus"),
        ("4", "AUD-001", "Audit Trail",
         "Pencatatan Log Riwayat Edit Transaksi",
         "Edit keterangan dan nominal salah satu transaksi yang sudah ada",
         "Nominal lama: Rp20.000 → Baru: Rp25.000",
         "Log edit mencatat delta perubahan nilai (+Rp5.000), alasan edit, dan timestamp revisi di tabel transaction_edits",
         "✅ Lulus"),
        ("5", "TSH-001", "Soft Deletes",
         "Penghapusan Sementara Transaksi (Pindah ke Trash)",
         "Klik tombol Hapus pada transaksi kas, konfirmasi modal",
         "Transaksi ID: #TX-042",
         "Transaksi tidak terhapus permanen (terisi deleted_at), saldo disesuaikan, data muncul di tab Trash",
         "✅ Lulus"),
        ("6", "TSH-002", "Trash Restore",
         "Pemulihan Transaksi dari Trash",
         "Buka tab Riwayat Terhapus, klik tombol Restore pada transaksi",
         "Transaksi ID: #TX-042",
         "Nilai deleted_at kembali NULL, transaksi muncul kembali di tabel utama, saldo kas bertambah sesuai nominal",
         "✅ Lulus"),
        ("7", "ROL-001", "Role Handover",
         "Serah Terima Jabatan Bendahara",
         "Pilih siswa calon bendahara baru, masukkan konfirmasi password, klik Transfer Jabatan",
         "User Target ID: #USR-15",
         "Akun lama terdegradasi ke hak Pelajar; user terpilih memperoleh akses Dashboard Bendahara",
         "✅ Lulus"),
        ("8", "SYNC-001", "Database Ledger",
         "Sinkronisasi Formula Agregasi Saldo Supabase",
         "Input transaksi pengeluaran perlengkapan kelas Rp50.000",
         "Pengeluaran: Rp50.000",
         "Total pengeluaran bertambah dan sisa saldo berkurang sinkron di Landing Page dan Dashboard Bendahara",
         "✅ Lulus"),
        ("9", "UI-001", "Visual Accessibility",
         "Optimalisasi Keterbacaan dan Kontras Landing Page",
         "Buka Landing Page pada mode terang dan gelap di perangkat seluler",
         "Viewport: 390px (Mobile)",
         "Teks, kartu saldo, dan badge status terbaca jelas dengan rasio kontras tinggi",
         "✅ Lulus"),
    ]

    table = doc.add_table(rows=1 + len(ROWS), cols=len(HEADERS))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Set column widths
    for ci, cm_w in enumerate(COL_WIDTHS_CM):
        for ri in range(len(ROWS) + 1):
            table.cell(ri, ci).width = Cm(cm_w)

    # Header row
    hdr_row = table.rows[0]
    for ci, hdr in enumerate(HEADERS):
        cell = hdr_row.cells[ci]
        set_cell_bg(cell, "#1E3A8A")
        set_cell_margins(cell)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(hdr)
        run.bold = True
        run.font.size = Pt(8)
        run.font.name = "Arial"
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    # Data rows
    for ri, row_data in enumerate(ROWS):
        row = table.rows[ri + 1]
        bg = "#F8FAFC" if ri % 2 == 0 else "#FFFFFF"
        for ci, text in enumerate(row_data):
            cell = row.cells[ci]
            set_cell_bg(cell, bg)
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            set_cell_border(cell, top="D1D5DB", bottom="D1D5DB", left="D1D5DB", right="D1D5DB")
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            center_cols = {0, 1, 7}
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if ci in center_cols else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(1)
            is_result = ci == 7
            run = p.add_run(text)
            run.font.size = Pt(7.5)
            run.font.name = "Arial"
            if is_result:
                run.font.color.rgb = _hex("#166534")
                run.bold = True
            elif ci == 1:
                run.font.color.rgb = _hex("#1E3A8A")
                run.bold = True
            else:
                run.font.color.rgb = _hex("#1F2937")


# ---------------------------------------------------------------------------
# Main builder
# ---------------------------------------------------------------------------

def build_document():
    doc = Document()

    # Page margins (2.54 cm ≈ 1 inch)
    section = doc.sections[0]
    section.top_margin    = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin   = Cm(2.54)
    section.right_margin  = Cm(2.54)

    # ── COVER HEADER ─────────────────────────────────────────────────────────

    # Navy accent bar (via shaded 1-cell table)
    accent = doc.add_table(rows=1, cols=1)
    accent.alignment = WD_TABLE_ALIGNMENT.CENTER
    ac = accent.cell(0, 0)
    set_cell_bg(ac, "#1E3A8A")
    ac_p = ac.paragraphs[0]
    ac_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    ac_p.paragraph_format.space_before = Pt(10)
    ac_p.paragraph_format.space_after  = Pt(10)
    ac_title = ac_p.add_run("DOKUMENTASI SISTEM REKAP KAS KELAS")
    ac_title.font.size = Pt(16)
    ac_title.bold = True
    ac_title.font.name = "Arial"
    ac_title.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    doc.add_paragraph()

    # Metadata card
    meta = doc.add_table(rows=4, cols=2)
    meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Nama Kelompok", "Reyhan Septianto Ramadhan & Billy Tristan Pradipta"),
        ("Kelas",         "XI PPLG 2"),
        ("Mata Pelajaran","Projek Perangkat Lunak (PPL)"),
        ("Institusi",     "SMKN 1 Ciomas — Program Keahlian PPLG"),
    ]
    for ri, (label, value) in enumerate(meta_data):
        lc = meta.cell(ri, 0)
        vc = meta.cell(ri, 1)
        set_cell_bg(lc, "#EFF6FF")
        set_cell_bg(vc, "#FFFFFF")
        set_cell_margins(lc, top=50, bottom=50, left=100, right=80)
        set_cell_margins(vc, top=50, bottom=50, left=100, right=100)
        for c, txt, bold in ((lc, label, True), (vc, value, False)):
            p = c.paragraphs[0]
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after  = Pt(1)
            run = p.add_run(txt)
            run.bold = bold
            run.font.size = Pt(10)
            run.font.name = "Arial"
            run.font.color.rgb = _hex("#1F2937" if not bold else "#1E3A8A")

    doc.add_paragraph()
    divider(doc)

    # GitHub link
    link_p = doc.add_paragraph()
    link_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    link_p.paragraph_format.space_before = Pt(6)
    link_p.paragraph_format.space_after  = Pt(4)
    link_label = link_p.add_run("🔗  Tautan Repositori GitHub : ")
    link_label.font.size = Pt(10)
    link_label.font.name = "Arial"
    link_label.font.color.rgb = _hex("#374151")
    link_url = link_p.add_run("https://github.com/Maniaman123/Rekap-Uang-Kas-XI-PPLG-2")
    link_url.font.size = Pt(10)
    link_url.font.name = "Arial"
    link_url.font.color.rgb = _hex("#1D4ED8")
    link_url.underline = True

    # Subtitle
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.paragraph_format.space_before = Pt(2)
    sub.paragraph_format.space_after  = Pt(14)
    sr = sub.add_run(
        "SCREENSHOT TAMPILAN PROGRAM — SISTEM REKAP KAS KELAS\n"
        "Menggunakan Laravel 13, Inertia.js (React), Tailwind CSS, dan Supabase (PostgreSQL)"
    )
    sr.font.size = Pt(9)
    sr.font.name = "Arial"
    sr.italic = True
    sr.font.color.rgb = _hex("#6B7280")

    divider(doc)
    doc.add_paragraph()

    # ── SECTION 1: SCREENSHOTS ────────────────────────────────────────────────

    para(doc, "A. Tampilan Antarmuka Program", bold=True, size=12,
         color="#1E3A8A", space_before=4, space_after=8)

    screenshots = [
        (
            "Halaman Beranda Pelajar — http://[domain]/",
            "Antarmuka utama publik yang menyajikan informasi saldo kas kelas secara real-time, "
            "ringkasan total pemasukan dan pengeluaran, visualisasi grafik mutasi kas, serta tabel "
            "transparansi histori pembayaran kas tanpa memerlukan akses login bendahara."
        ),
        (
            "Dashboard Bendahara & Pagination Transaksi — http://[domain]/transactions",
            "Pusat kendali operasional bendahara yang dilengkapi kartu statistik kas, tombol navigasi "
            "'Kembali ke Beranda', serta tabel daftar mutasi transaksi dengan kontrol pagination dinamis "
            "(10 data per halaman) dan pelestarian parameter filter pencarian."
        ),
        (
            "Form Transaksi Preset Pemasukan Tak Terduga",
            "Modal input mutasi kas khusus yang menyediakan tombol preset instan untuk kategori Denda "
            "Keterlambatan dan Pembayaran Kas Susulan Bulan Lalu, yang secara otomatis terkalkulasi ke "
            "dalam ledger pemasukan kas utama."
        ),
        (
            "Audit Trail — Log Riwayat Edit Kas",
            "Halaman jejak audit transparansi yang mencatat histori modifikasi transaksi secara mendalam, "
            "membandingkan data nominal dan keterangan sebelum vs sesudah diedit, identitas editor, waktu "
            "revisi, serta alasan perubahan data."
        ),
        (
            "Riwayat Transaksi Terhapus — Trash & Restore Log",
            "Antarmuka pengelolaan data terhapus berbasis soft-deletes yang mencegah kehilangan data "
            "permanen akibat ketidaksengajaan, dilengkapi tombol konfirmasi audit dan aksi pemulihan "
            "(restore) data ke ledger aktif."
        ),
        (
            "Antarmuka Serah Terima Jabatan Bendahara — Role Handover",
            "Fitur tata kelola kepengurusan kelas yang memungkinkan bendahara lama mengalihkan hak akses "
            "administratif secara aman kepada bendahara baru yang dipilih dari daftar siswa terdaftar, "
            "dengan konfirmasi autentikasi keamanan ganda."
        ),
    ]

    for i, (label, caption) in enumerate(screenshots, start=1):
        screenshot_placeholder(doc, label, caption, i)

    doc.add_paragraph()
    divider(doc)
    doc.add_paragraph()

    # ── SECTION 2: UNIT TESTS ─────────────────────────────────────────────────

    para(doc, "B. Tabel Pengujian Unit Program", bold=True, size=12,
         color="#1E3A8A", space_before=4, space_after=4)
    para(doc,
         "Pengujian dilakukan menggunakan PHPUnit (Laravel 13) dengan environment pengujian SQLite in-memory "
         "dan integrasi Supabase PostgreSQL pada environment staging.",
         size=9, color="#6B7280", space_before=0, space_after=10)

    build_test_table(doc)

    doc.add_paragraph()
    divider(doc)

    # ── FOOTER NOTE ───────────────────────────────────────────────────────────
    doc.add_paragraph()
    note_p = doc.add_paragraph()
    note_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    nr = note_p.add_run(
        "Dokumen ini digenerate secara otomatis oleh generate_documentation.py  •  "
        "Rekap Kas XI PPLG 2  •  SMKN 1 Ciomas  •  2026"
    )
    nr.font.size = Pt(8)
    nr.font.name = "Arial"
    nr.font.color.rgb = _hex("#9CA3AF")
    nr.italic = True

    # ── SAVE ─────────────────────────────────────────────────────────────────
    out_path = "DOKUMENTASI_REKAP_KAS_XI_PPLG_2.docx"
    doc.save(out_path)
    print(f"\n✅  Dokumen berhasil dibuat: {os.path.abspath(out_path)}\n")


if __name__ == "__main__":
    build_document()

