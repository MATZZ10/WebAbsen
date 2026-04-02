import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-5xl space-y-10 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-2xl shadow-[0_20px_80px_rgba(15,23,42,0.45)]">
          <div className="max-w-3xl space-y-6">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400">Sistem Absensi Sekolah</div>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Absensi Aman & Terikat Perangkat</h1>
            <p className="text-base leading-7 text-slate-300 sm:text-lg">
              Di sini setiap login diberi kunci perangkat satu per akun. Logout tidak bisa memindah akun ke perangkat lain tanpa reset admin.
              Pastikan login di perangkat resmi Anda untuk akses rekap dan absensi.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Masuk (admin/teacher)
              </Link>
              <Link
                href="/attendance"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Halaman Siswa
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
            <h2 className="text-xl font-semibold">Dashboard Siswa</h2>
            <p className="mt-3 text-sm text-slate-400">Halaman landing untuk siswa dengan desain ringan dan intuitif.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
            <h2 className="text-xl font-semibold">Absensi Wajah</h2>
            <p className="mt-3 text-sm text-slate-400">Verifikasi wajah langsung dari kamera dengan dukungan lokasi.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
            <h2 className="text-xl font-semibold">Rekap Guru</h2>
            <p className="mt-3 text-sm text-slate-400">Akses rekap bulanan, data kehadiran, dan laporan secara cepat.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
