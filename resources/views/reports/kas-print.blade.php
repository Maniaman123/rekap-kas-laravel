<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Kas XI PPLG 2</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1a202c; background: #f0f4f8; padding: 24px; }
        .page { max-width: 210mm; margin: 0 auto; background: #fff; box-shadow: 0 4px 32px rgba(0,0,0,.12); }
        .letterhead { border-bottom: 3px solid #1e3a8a; padding: 20px 28px 14px; }
        .letterhead-inner { display: flex; align-items: flex-start; gap: 16px; }
        .letterhead-logo { width: 52px; height: 52px; border-radius: 50%; background: #1e3a8a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #facc15; font-size: 22px; font-weight: 900; }
        .letterhead-text { flex: 1; }
        .letterhead-text h1 { font-size: 13pt; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: .04em; line-height: 1.2; }
        .letterhead-text p { font-size: 9pt; color: #64748b; margin-top: 3px; }
        .letterhead-meta { text-align: right; font-size: 8.5pt; color: #64748b; line-height: 1.6; }
        .letterhead-meta strong { color: #1e3a8a; }
        .letterhead-divider { border: none; border-top: 1px solid #e2e8f0; margin-top: 14px; }
        .doc-title { background: #1e3a8a; color: #fff; text-align: center; padding: 14px 28px; }
        .doc-title h2 { font-size: 12pt; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
        .doc-title p { font-size: 9pt; opacity: .75; margin-top: 4px; }
        .filter-bar { background: #eff6ff; border-bottom: 1px solid #bfdbfe; padding: 8px 28px; font-size: 8.5pt; color: #1d4ed8; display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; }
        .filter-bar .label { font-weight: 700; }
        .filter-pill { background: #dbeafe; border-radius: 4px; padding: 2px 8px; font-weight: 600; }
        .summary-row { display: flex; border-bottom: 2px solid #e2e8f0; }
        .summary-card { flex: 1; padding: 14px 20px; border-right: 1px solid #e2e8f0; }
        .summary-card:last-child { border-right: none; }
        .card-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
        .card-value { font-family: 'Courier New', monospace; font-size: 14pt; font-weight: 800; margin-top: 4px; font-variant-numeric: tabular-nums; }
        .card-navy .card-value { color: #1e3a8a; } .card-navy .card-label { color: #3b82f6; }
        .card-green .card-value { color: #059669; } .card-green .card-label { color: #10b981; }
        .card-red .card-value { color: #dc2626; } .card-red .card-label { color: #f87171; }
        table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        thead tr { background: #1e3a8a; }
        thead th { padding: 8px 10px; color: #fff; font-weight: 700; font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; text-align: left; }
        thead th.r { text-align: right; } thead th.c { text-align: center; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .mono { font-family: 'Courier New', monospace; font-variant-numeric: tabular-nums; }
        .r { text-align: right; } .c { text-align: center; }
        .badge { display: inline-block; border-radius: 4px; padding: 2px 8px; font-size: 7.5pt; font-weight: 700; }
        .badge-in { background: #dcfce7; color: #166534; } .badge-out { background: #fee2e2; color: #991b1b; }
        .amt-in { color: #059669; font-weight: 700; } .amt-out { color: #dc2626; font-weight: 700; }
        .run-pos { color: #1e3a8a; font-weight: 600; } .run-neg { color: #dc2626; font-weight: 600; }
        .no-data { text-align: center; padding: 32px; color: #94a3b8; font-size: 10pt; }
        .sig-section { border-top: 2px solid #e2e8f0; padding: 20px 28px 28px; }
        .sig-row { display: flex; justify-content: space-between; gap: 40px; margin-top: 8px; }
        .sig-block { flex: 1; }
        .sig-title { font-size: 9pt; font-weight: 700; color: #374151; margin-bottom: 2px; }
        .sig-subtitle { font-size: 8pt; color: #94a3b8; }
        .sig-line { border-top: 1px solid #374151; margin-top: 56px; padding-top: 5px; }
        .sig-name { font-size: 9pt; font-weight: 700; color: #1e3a8a; }
        .sig-role { font-size: 8pt; color: #64748b; }
        .sig-date { font-size: 8pt; color: #94a3b8; margin-bottom: 12px; }
        .no-print { max-width: 210mm; margin: 0 auto 16px; display: flex; gap: 10px; align-items: center; }
        .btn-print { background: #1e3a8a; color: #facc15; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; }
        .btn-back { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 8px; font-size: 12px; cursor: pointer; text-decoration: none; }
        .badge-count { background: #e0f2fe; color: #0c4a6e; border-radius: 20px; padding: 2px 10px; font-size: 11px; font-weight: 600; margin-left: auto; }
        .page-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 8px 28px; display: flex; justify-content: space-between; font-size: 7.5pt; color: #94a3b8; }
        @page { size: A4 portrait; margin: 12mm 10mm 15mm; }
        @media print {
            body { background: #fff; padding: 0; font-size: 9pt; }
            .page { box-shadow: none; max-width: 100%; }
            .no-print { display: none !important; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
            .sig-section, .summary-row { page-break-inside: avoid; }
        }
    </style>
</head>
<body>

<div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨 Cetak / Simpan PDF</button>
    <a href="javascript:history.back()" class="btn-back">← Kembali ke Dashboard</a>
    <span class="badge-count">{{ $rows->count() }} transaksi</span>
</div>

<div class="page">
    <div class="letterhead">
        <div class="letterhead-inner">
            <div class="letterhead-logo">K</div>
            <div class="letterhead-text">
                <h1>SMK · XI PPLG 2</h1>
                <p>Laporan Pertanggungjawaban Keuangan Kelas</p>
            </div>
            <div class="letterhead-meta">
                <strong>Dicetak oleh</strong><br>
                {{ $bendahara }}<br>
                <strong>Pada</strong><br>
                {{ $printedAt }}
            </div>
        </div>
        <hr class="letterhead-divider">
    </div>

    <div class="doc-title">
        <h2>Laporan Pertanggungjawaban Uang Kas<br>Kelas XI PPLG 2</h2>
        @if($filterLabels->isNotEmpty())
            <p>Filter: {{ $filterLabels->implode(' &middot; ') }}</p>
        @else
            <p>Seluruh transaksi kas &mdash; tanpa filter</p>
        @endif
    </div>

    @if($filterLabels->isNotEmpty())
    <div class="filter-bar">
        <span class="label">Filter aktif:</span>
        @foreach($filterLabels as $lbl)
            <span class="filter-pill">{{ $lbl }}</span>
        @endforeach
    </div>
    @endif

    <div class="summary-row">
        <div class="summary-card card-navy">
            <div class="card-label">Saldo Kas Terakhir</div>
            <div class="card-value">Rp {{ number_format($sisaSaldo, 0, ',', '.') }}</div>
        </div>
        <div class="summary-card card-green">
            <div class="card-label">Total Pemasukan</div>
            <div class="card-value">Rp {{ number_format($totalMasuk, 0, ',', '.') }}</div>
        </div>
        <div class="summary-card card-red">
            <div class="card-label">Total Pengeluaran</div>
            <div class="card-value">Rp {{ number_format($totalKeluar, 0, ',', '.') }}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="c" style="width:30px">#</th>
                <th style="width:78px">Tanggal</th>
                <th style="width:78px">Kategori</th>
                <th>Keterangan</th>
                <th class="c" style="width:58px">Tipe</th>
                <th class="r" style="width:100px">Nominal (Rp)</th>
                <th class="r" style="width:100px">Saldo Berjalan</th>
                <th style="width:80px">Dicatat Oleh</th>
            </tr>
        </thead>
        <tbody>
            @if($rows->isEmpty())
                <tr><td colspan="8" class="no-data">Tidak ada transaksi yang sesuai dengan filter.</td></tr>
            @else
                @php $running = 0; @endphp
                @foreach($rows as $i => $tx)
                    @php
                        $isMasuk  = $tx->type === 'masuk';
                        $running += $isMasuk ? $tx->amount : -$tx->amount;
                    @endphp
                    <tr>
                        <td class="c" style="color:#94a3b8;font-size:8.5pt">{{ $i + 1 }}</td>
                        <td class="mono" style="font-size:8.5pt;white-space:nowrap">{{ $tx->transaction_date->format('d M Y') }}</td>
                        <td style="font-size:8.5pt">{{ $tx->category }}</td>
                        <td style="color:#475569;font-size:8.5pt">{{ $tx->description ?: '—' }}</td>
                        <td class="c"><span class="badge {{ $isMasuk ? 'badge-in' : 'badge-out' }}">{{ $isMasuk ? '+ Masuk' : '− Keluar' }}</span></td>
                        <td class="r mono {{ $isMasuk ? 'amt-in' : 'amt-out' }}">{{ ($isMasuk ? '+' : '−') . ' Rp ' . number_format($tx->amount, 0, ',', '.') }}</td>
                        <td class="r mono {{ $running >= 0 ? 'run-pos' : 'run-neg' }}">
                            Rp {{ number_format(abs($running), 0, ',', '.') }}@if($running < 0) <span style="font-size:7pt">(−)</span>@endif
                        </td>
                        <td style="font-size:8pt;color:#64748b">{{ $tx->user?->name ?? '—' }}</td>
                    </tr>
                @endforeach
            @endif
        </tbody>
    </table>

    <div class="sig-section">
        <div class="sig-date">Dikeluarkan pada: {{ now()->locale('id')->isoFormat('D MMMM YYYY') }}</div>
        <div class="sig-row">
            <div class="sig-block">
                <div class="sig-title">Mengetahui,</div>
                <div class="sig-subtitle">Wali Kelas XI PPLG 2</div>
                <div class="sig-line">
                    <div class="sig-name">( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
                    <div class="sig-role">NIP. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
                </div>
            </div>
            <div class="sig-block" style="text-align:right">
                <div class="sig-title">Bendahara Kelas,</div>
                <div class="sig-subtitle">XI PPLG 2</div>
                <div class="sig-line">
                    <div class="sig-name">( {{ $bendahara }} )</div>
                    <div class="sig-role">Bendahara Kelas XI PPLG 2</div>
                </div>
            </div>
        </div>
    </div>

    <div class="page-footer">
        <span>XI PPLG 2 &middot; Rekap Kas Kelas &mdash; Dokumen Resmi</span>
        <span>Sistem rekap-kas &middot; {{ now()->format('Y') }}</span>
    </div>
</div>

<script>
    window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 400); });
</script>
</body>
</html>
