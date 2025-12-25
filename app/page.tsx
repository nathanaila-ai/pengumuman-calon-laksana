"use client";

import { useMemo, useRef, useState } from "react";

const MOTIVATIONS = [
  "Langkahmu hari ini adalah awal kontribusi besar besok. Gas terus!",
  "Selamat! Tetap rendah hati, terus belajar, dan buktikan lewat aksi.",
  "Kamu sudah sampai sini—sekarang waktunya tumbuh dan berdampak.",
  "Satu tim, satu tujuan. Jadilah versi terbaikmu di periode ini!",
  "Kemenangan kecil hari ini = fondasi untuk prestasi yang lebih besar.",
];

type ResultData = {
  nim: string;
  nama: string;
  fakultas: string;
  biro: string;
  status: string;
  narahubungNama: string;
  narahubungWA: string;
  narahubungLine: string;
  catatan: string;
};

function normalizeStatus(raw: unknown) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Terima input WA dari sheet dalam berbagai format:
 * - "6289xxxx"
 * - "+6289xxxx"
 * - "08xxxx"
 * - "wa.me/6289xxxx"
 * - "https://wa.me/6289xxxx"
 * - "https://api.whatsapp.com/send?phone=6289xxxx"
 *
 * Output: URL wa.me yang valid atau null kalau tidak bisa diproses.
 */
function buildWhatsAppUrl(raw: unknown) {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  // Kalau sudah berupa URL wa.me atau api.whatsapp.com, ambil phone-nya
  // 1) wa.me/<digits>
  const waMeMatch = s.match(/wa\.me\/(\d+)/i);
  if (waMeMatch?.[1]) return `https://wa.me/${waMeMatch[1]}`;

  // 2) api.whatsapp.com/send?phone=<digits>
  const apiMatch = s.match(/api\.whatsapp\.com\/send\?phone=(\d+)/i);
  if (apiMatch?.[1]) return `https://wa.me/${apiMatch[1]}`;

  // Kalau user cuma isi digit / + / spasi / strip
  // buang semua karakter non-digit
  let digits = s.replace(/[^\d]/g, "");

  // Kalau mulai "0" (format lokal Indonesia), ubah jadi 62
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);

  // Kalau bukan diawali 62, biarkan apa adanya tapi tetap valid digits
  // Minimal 9-10 digit biar tidak ngawur (bisa kamu longgarkan kalau perlu)
  if (digits.length < 9) return null;

  return `https://wa.me/${digits}`;
}

export default function Page() {
  const [nim, setNim] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState<ResultData | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const motivation = useMemo(() => {
    return MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
  }, [data?.nim]);

  async function cekKelulusan() {
    setErr("");
    setData(null);

    const v = nim.trim();
    if (!v) return setErr("NIM wajib diisi.");

    setLoading(true);
    try {
      const res = await fetch(`/api/check?nim=${encodeURIComponent(v)}`);
      const json = await res.json();

      if (!json.ok) {
        setErr(json.message || "Gagal memproses.");
        return;
      }

      setData(json.data);

      // ✅ Confetti hanya kalau status tepat "lulus"
      const st = normalizeStatus(json.data.status);
      if (st === "lulus") {
        startConfetti(canvasRef.current, 2000);
      }
    } catch {
      setErr("Tidak bisa terhubung. Coba refresh atau cek koneksi.");
    } finally {
      setLoading(false);
    }
  }

  const st = normalizeStatus(data?.status);
  const isLulus = st === "lulus";
  const isTidakLulus = st === "tidak lulus";

  const waUrl = useMemo(() => buildWhatsAppUrl(data?.narahubungWA), [data?.narahubungWA]);

  return (
    <main className="min-h-screen">
      <canvas ref={canvasRef} className="confetti" />

      <div className="blob one" />
      <div className="blob two" />

      <div className="wrap">
        <div className="logo" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 2l7 5v15H5V7l7-5zm0 2.3L7 7v13h10V7l-5-2.7zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
          </svg>
        </div>

        <h1>Pengumuman Kelulusan</h1>
        <div className="sub">
          Calon Laksana Ormawa Eksekutif PKU IPB
          <br />
          Periode 2025/2026
        </div>

        <section className="card">
          <label htmlFor="nim">Masukkan NIM Anda</label>

          <div className="row">
            <input
              id="nim"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Contoh: M0120251108"
            />
            <button onClick={cekKelulusan} disabled={loading}>
              🔎 <span>{loading ? "Memeriksa..." : "Cek Kelulusan"}</span>
            </button>
          </div>

          <div className="hint">Pastikan NIM sesuai yang terdaftar.</div>

          {err ? <div className="error">{err}</div> : null}

          {data ? (
            <div className="result">
              <div className={["badge", isLulus ? "ok" : isTidakLulus ? "no" : "maybe"].join(" ")}>
                {isLulus ? "✅ LULUS" : isTidakLulus ? "❌ TIDAK LULUS" : "⏳ MENUNGGU"}
              </div>

              <div className="grid">
                <div className="k">Nama</div>
                <div className="v">{data.nama}</div>

                <div className="k">NIM</div>
                <div className="v">{data.nim}</div>

                <div className="k">Fakultas</div>
                <div className="v">{data.fakultas}</div>

                <div className="k">Biro/Departemen</div>
                <div className="v">{data.biro}</div>

                <div className="k">Status Kelulusan</div>
                <div className="v">{data.status}</div>
              </div>

              <div className="motivation">{motivation}</div>

              <div className="notice">
                {isLulus ? (
                  <>
                    <strong>Jika sudah dinyatakan lulus, silahkan hubungi kontak di bawah ini:</strong>
                    <div style={{ marginTop: 8 }}>
                      {waUrl ? (
                        <div>
                          📱 WhatsApp:{" "}
                          <a target="_blank" rel="noopener noreferrer" href={waUrl}>
                            Chat {data.narahubungNama || "Narahubung"}
                          </a>
                        </div>
                      ) : null}

                      {data.narahubungLine ? (
                        <div>
                          💬 LINE: <strong>{data.narahubungLine}</strong>
                        </div>
                      ) : null}

                      {!waUrl && !data.narahubungLine ? (
                        <div>Kontak narahubung belum tersedia / format belum valid di database.</div>
                      ) : null}

                      {data.catatan ? (
                        <div style={{ marginTop: 8 }}>
                          <strong>Catatan:</strong> {data.catatan}
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <strong>Info:</strong> Tetap semangat. Jika merasa ada kekeliruan data, hubungi panitia.
                  </>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <style jsx global>{`
        :root{
          --gray1:#606060;
          --gray2:#5A5B5B;
          --gray3:#4F5051;
          --gray4:#6D6E71;

          --gold1:#F9F286;
          --gold2:#F5E345;
          --gold3:#FCB73E;

          --red1:#9B2E41;
          --red2:#BE1E2D;

          --shadow: 0 18px 60px rgba(0,0,0,.22);
          --radius: 14px;
        }

        *{box-sizing:border-box}
        html,body{margin:0;padding:0}
        body{
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          background:
            radial-gradient(1200px 600px at 25% 10%, rgba(255,255,255,.18), transparent 55%),
            linear-gradient(135deg, var(--red1), var(--red2));
          color:#fff;
          overflow-x:hidden;
        }

        .min-h-screen{min-height:100vh; display:flex; align-items:center; justify-content:center; padding:28px 14px; position:relative;}
        .wrap{width:100%; max-width: 820px; text-align:center; position:relative; z-index:2;}

        .logo{
          width:42px;height:42px;margin:0 auto 14px;
          border-radius:50%;
          background: rgba(255,255,255,.18);
          display:flex; align-items:center; justify-content:center;
          border: 1px solid rgba(255,255,255,.18);
          backdrop-filter: blur(8px);
        }
        .logo svg{ width:22px; height:22px; fill:#fff; opacity:.92; }

        h1{ margin:0; font-size:28px; letter-spacing:.2px; }
        .sub{ margin-top:6px; font-size:13px; color: rgba(255,255,255,.86); line-height:1.4; font-weight:700; }

        .card{
          margin:18px auto 0;
          width:min(640px, 100%);
          background: rgba(255,255,255,.95);
          color: var(--gray3);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          border: 1px solid rgba(255,255,255,.55);
          padding:16px;
          text-align:left;
        }

        label{ display:block; font-size:13px; font-weight:900; margin-bottom:8px; color: var(--gray3); }
        .row{ display:flex; gap:10px; align-items:stretch; flex-wrap:wrap; }

        input{
          flex:1 1 280px;
          padding:12px 12px;
          border-radius: 10px;
          border:1px solid rgba(79,80,81,.20);
          font-size:14px;
          outline:none;
        }
        input:focus{
          border-color: rgba(190,30,45,.55);
          box-shadow:0 0 0 3px rgba(190,30,45,.12);
        }

        button{
          flex:0 0 180px;
          border:1px solid rgba(252,183,62,.45);
          border-radius: 10px;
          font-weight:900;
          color:#fff;
          cursor:pointer;
          padding:12px 14px;
          background: linear-gradient(90deg, var(--red2), var(--red1));
          transition: transform .08s ease, filter .2s ease;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        button:active{ transform: translateY(1px) scale(.99); }
        button[disabled]{ opacity:.65; cursor:not-allowed; }

        .hint{ margin-top:10px; font-size:12px; color: rgba(79,80,81,.72); font-weight:700; }
        .error{ margin-top:12px; font-size:13px; color: var(--red2); font-weight:900; }

        .result{
          margin-top:14px;
          padding:14px;
          border-radius: 12px;
          border: 1px solid rgba(79,80,81,.12);
          background: #fff;
        }

        .badge{
          display:inline-flex; align-items:center; gap:8px;
          padding:6px 10px;
          border-radius:999px;
          font-weight:1000;
          font-size:12px;
          margin-bottom:10px;
        }
        .ok{ background: rgba(38,174,96,.12); color:#167a40; border:1px solid rgba(38,174,96,.22); }
        .no{ background: rgba(190,30,45,.10); color: var(--red2); border:1px solid rgba(190,30,45,.22); }
        .maybe{ background: rgba(252,183,62,.16); color:#8a6500; border:1px solid rgba(252,183,62,.30); }

        .grid{
          display:grid;
          grid-template-columns: 160px 1fr;
          gap:8px 10px;
          font-size:14px;
          line-height:1.35;
        }
        .k{ color: var(--gray4); font-weight:900; }
        .v{ color: #111; font-weight:900; }

        .motivation{ margin-top:10px; font-weight:1000; color:#111; font-size:14px; }
        .notice{
          margin-top:12px;
          padding:12px;
          border-radius: 12px;
          background: rgba(252,183,62,.10);
          border:1px dashed rgba(252,183,62,.55);
          font-size:13px;
          color: #111;
          font-weight:800;
        }
        .notice a{ color: var(--red2); font-weight:1000; text-decoration:none; }

        .blob{
          position:fixed;
          width:280px;height:280px;
          border:4px solid var(--gold3);
          border-radius: 38% 62% 63% 37% / 50% 45% 55% 50%;
          opacity:.95;
          pointer-events:none;
          z-index:1;
        }
        .blob.one{ right:-90px; top:-60px; transform: rotate(12deg); }
        .blob.two{ left:-110px; bottom:-100px; transform: rotate(-16deg); border-color: var(--gold2); opacity:.9; }

        .confetti{
          position:fixed;
          inset:0;
          width:100%;
          height:100%;
          pointer-events:none;
          z-index:0;
        }
      `}</style>
    </main>
  );
}

function startConfetti(canvas: HTMLCanvasElement | null, durationMs = 1800) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let raf: number | null = null;

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const colors = ["#FCB73E", "#F5E345", "#F9F286", "#ffffff", "#BE1E2D", "#9B2E41"];
  const pieces = Array.from({ length: 140 }).map(() => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * window.innerHeight,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 10,
    vx: -1.2 + Math.random() * 2.4,
    vy: 2.6 + Math.random() * 4.2,
    r: Math.random() * Math.PI,
    vr: -0.18 + Math.random() * 0.36,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));

  const start = performance.now();
  const frame = (t: number) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;

      if (p.y > window.innerHeight + 30) {
        p.y = -30;
        p.x = Math.random() * window.innerWidth;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (t - start < durationMs) {
      raf = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (raf) cancelAnimationFrame(raf);
    }
  };

  if (raf) cancelAnimationFrame(raf);
  requestAnimationFrame(frame);
}
