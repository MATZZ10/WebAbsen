import Link from "next/link";
import { ArrowRight, Clock, MapPin, Lock, Users, BarChart3, Shield, Smartphone } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            WebAbsen
          </div>
          <Link
            href="/attendance"
            className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium"
          >
            Mulai Absen
          </Link>
        </div>
      </nav>

      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl"></div>
          </div>

          <div className="text-center space-y-6 mb-16">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300 font-medium">
                ✨ Sistem Absensi Modern & Aman
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Absensi Cerdas.{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Terpercaya.
              </span>
              <br />
              Terintegrasi.
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Platform absensi sekolah yang aman dengan verifikasi lokasi, device locking ketat, dan kontrol waktu absen oleh guru. Cegah pembobolan absensi dengan teknologi terkini.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/attendance"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-semibold transition shadow-lg hover:shadow-xl"
              >
                Mulai Absen <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Fitur Unggulan</h2>
            <p className="text-xl text-slate-400">Keamanan tingkat enterprise untuk institusi pendidikan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition">
                <MapPin className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verifikasi Lokasi</h3>
              <p className="text-slate-400">
                Siswa hanya bisa absen dari lokasi yang ditentukan guru. Mencegah pembobolan absensi dari rumah.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition">
                <Lock className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Device Locking</h3>
              <p className="text-slate-400">
                1 akun = 1 perangkat. Akun tidak bisa dipindah ke device lain tanpa reset guru.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition">
                <Clock className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Time Gate Control</h3>
              <p className="text-slate-400">
                Guru dapat membuka dan menutup sistem absen sesuai jam yang ditentukan.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition">
                <Smartphone className="text-green-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Responsif & Cepat</h3>
              <p className="text-slate-400">
                Bekerja optimal di semua device. Loading cepat dan antarmuka yang intuitif.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition">
                <BarChart3 className="text-orange-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Laporan & Analytics</h3>
              <p className="text-slate-400">
                Dashboard guru dengan laporan kehadiran real-time dan analytics mendalam.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 transition backdrop-blur-xl">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4 group-hover:bg-red-500/30 transition">
                <Shield className="text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Keamanan Berlapis</h3>
              <p className="text-slate-400">
                Enkripsi data, verifikasi GPS, device fingerprinting, dan kontrol akses role-based.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Cara Kerja Sistem</h2>
            <p className="text-xl text-slate-400">Alur absensi yang sistematis dan aman</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Siswa Login", desc: "Verifikasi device dan lokasi GPS" },
              { step: "2", title: "Lokasi Check", desc: "Sistem validasi locasi sekolah" },
              { step: "3", title: "Time Gate", desc: "Cek jam absen sudah dibuka" },
              { step: "4", title: "Absen Tercatat", desc: "Data absensi tersimpan dengan lokasi" },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 text-blue-500">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Keamanan Tingkat Enterprise</h2>
              <ul className="space-y-4">
                {[
                  "Geolocation Validation - Cegah absensi dari lokasi lain",
                  "Device Fingerprinting - Deteksi perubahan device setup",
                  "Strict Device Locking - 1 akun per perangkat maksimal",
                  "Role-Based Access - Kontrol akses guru vs siswa",
                  "Encrypted Database - Semua data terenkripsi",
                  "Audit Logging - Trail lengkap setiap aktivitas",
                  "Real-time Monitoring - Dashboard guru live tracking",
                  "Automatic Time Gate - Kontrol sistem absensi per jam",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-8 backdrop-blur-xl">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Shield className="text-blue-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold mb-1">Perlindungan Maksimal</h3>
                    <p className="text-sm text-slate-400">Data siswa dan guru dilindungi dengan standar keamanan internasional</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="text-cyan-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold mb-1">Multi-User Support</h3>
                    <p className="text-sm text-slate-400">Mendukung ribuan siswa dan guru secara bersamaan</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <BarChart3 className="text-purple-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold mb-1">Skalabilitas</h3>
                    <p className="text-sm text-slate-400">Infrastruktur cloud yang dapat diakses 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Siap Menggunakan WebAbsen?</h2>
          <p className="text-xl text-slate-300 mb-8">Bergabunglah dengan sekolah lain yang telah meningkatkan keamanan absensi mereka.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/attendance"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-semibold transition shadow-lg"
            >
              Mulai Absen Sekarang
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 font-semibold transition"
            >
              Akses Dashboard Guru
            </Link>
          </div>
        </div>
      </section>


      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">WebAbsen</h3>
              <p className="text-slate-400 text-sm">Platform absensi sekolah modern dengan verifikasi lokasi dan device locking.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Fitur</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="#" className="hover:text-white transition">Geolocation</Link></li>
                <li><Link href="#" className="hover:text-white transition">Device Lock</Link></li>
                <li><Link href="#" className="hover:text-white transition">Time Gate</Link></li>
                <li><Link href="#" className="hover:text-white transition">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Dukungan</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="#" className="hover:text-white transition">Dokumentasi</Link></li>
                <li><Link href="#" className="hover:text-white transition">FAQ</Link></li>
                <li><Link href="#" className="hover:text-white transition">Kontak</Link></li>
                <li><Link href="#" className="hover:text-white transition">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-400">
            <p>&copy; 2024 WebAbsen. Semua hak dilindungi.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <Link href="#" className="hover:text-white transition">Privacy</Link>
              <Link href="#" className="hover:text-white transition">Terms</Link>
              <Link href="#" className="hover:text-white transition">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
