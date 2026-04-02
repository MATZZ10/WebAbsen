"use client";

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Calendar,
  Users,
  TrendingDown,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface AttendanceStats {
  totalRecords: number;
  present: number;
  late: number;
  sick: number;
  alpa: number;
  faceMethod: number;
  qrMethod: number;
}

interface StudentStat {
  studentName: string;
  className: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  sickDays: number;
  alpaDays: number;
  attendanceRate: number;
  lastAttendance: string | null;
}

interface FrequentAbsent {
  studentName: string;
  className: string;
  alpaDays: number;
  attendanceRate: number;
}

export default function RecapPage() {
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [frequentAbsent, setFrequentAbsent] = useState<FrequentAbsent[]>([]);
  const [classList, setClassList] = useState<string[]>([]);

  const fetchRecap = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        classId: selectedClass,
        status: "all",
      });

      const res = await fetch(`/api/admin/recap?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setStats(data.statistics);
      setStudentStats(data.studentStats || []);
      setFrequentAbsent(data.frequentlyAbsent || []);
      setClassList(data.classList || []);
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil data rekap");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecap();
  }, []);

  const exportToCSV = () => {
    const headers = [
      "Nama Siswa",
      "Kelas",
      "Total Hari",
      "Hadir",
      "Terlambat",
      "Sakit",
      "Alpa",
      "Persentase Kehadiran",
    ];
    const rows = studentStats.map((s) => [
      s.studentName,
      s.className,
      s.totalDays,
      s.presentDays,
      s.lateDays,
      s.sickDays,
      s.alpaDays,
      `${s.attendanceRate}%`,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rekap_absensi_${new Date().getTime()}.csv`);
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Rekap Kehadiran</h1>
          <p className="text-slate-400 mt-2">Laporan lengkap dan analytics absensi siswa</p>
        </div>

        <Card className="mb-8 bg-slate-900 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Filter</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Kelas
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="all">Semua Kelas</option>
                  {classList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={fetchRecap}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Loading..." : "Cari"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Hadir</p>
                      <p className="text-4xl font-bold text-green-400">{stats.present}</p>
                    </div>
                    <CheckCircle2 className="text-green-500" size={32} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Terlambat</p>
                      <p className="text-4xl font-bold text-yellow-400">{stats.late}</p>
                    </div>
                    <Clock className="text-yellow-500" size={32} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Sakit</p>
                      <p className="text-4xl font-bold text-blue-400">{stats.sick}</p>
                    </div>
                    <AlertCircle className="text-blue-500" size={32} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Alpa</p>
                      <p className="text-4xl font-bold text-red-400">{stats.alpa}</p>
                    </div>
                    <TrendingDown className="text-red-500" size={32} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-400" />
                    Metode Absensi
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300">Face Detection</span>
                        <span className="text-white font-bold">{stats.faceMethod}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.totalRecords > 0
                                ? (stats.faceMethod / stats.totalRecords) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300">QR Code</span>
                        <span className="text-white font-bold">{stats.qrMethod}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.totalRecords > 0
                                ? (stats.qrMethod / stats.totalRecords) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-orange-400" />
                    Statistik Umum
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Record</span>
                      <span className="text-white font-bold">{stats.totalRecords}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Presentase Hadir</span>
                      <span className="text-green-400 font-bold">
                        {stats.totalRecords > 0
                          ? (
                              ((stats.present + stats.late) / stats.totalRecords) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Presentase Alpa</span>
                      <span className="text-red-400 font-bold">
                        {stats.totalRecords > 0
                          ? ((stats.alpa / stats.totalRecords) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {frequentAbsent.length > 0 && (
              <Card className="mb-8 bg-red-500/10 border-red-500/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
                    <AlertCircle size={20} />
                    ⚠️ Siswa Sering Alpa
                  </h3>
                  <div className="space-y-3">
                    {frequentAbsent.map((student, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {student.studentName}
                          </p>
                          <p className="text-xs text-slate-400">{student.className}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className="border-red-500/50 bg-red-500/20 text-red-300 mb-1 block"
                          >
                            {student.alpaDays}x Alpa
                          </Badge>
                          <p className="text-sm text-slate-400">
                            {student.attendanceRate}% Kehadiran
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900 border-slate-700 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Detail Kehadiran Siswa
                  </h3>
                  <Button
                    onClick={exportToCSV}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Download size={16} />
                    Export CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold text-slate-300">
                          Nama Siswa
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-300">
                          Kelas
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-300">
                          Total Hari
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-300">
                          Hadir
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-300">
                          Terlambat
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-300">
                          Sakit
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-300">
                          Alpa
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-300">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-slate-400">
                            Tidak ada data
                          </td>
                        </tr>
                      ) : (
                        studentStats.map((s, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-800 hover:bg-slate-800/50"
                          >
                            <td className="py-3 px-4 text-white">{s.studentName}</td>
                            <td className="py-3 px-4 text-slate-400">{s.className}</td>
                            <td className="text-center py-3 px-4 text-slate-300">
                              {s.totalDays}
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-green-400 font-semibold">
                                {s.presentDays}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-yellow-400">{s.lateDays}</span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-blue-400">{s.sickDays}</span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-red-400 font-semibold">
                                {s.alpaDays}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <Badge
                                className={`${
                                  s.attendanceRate >= 80
                                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                                    : s.attendanceRate >= 60
                                    ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                                    : "bg-red-500/20 border-red-500/50 text-red-400"
                                } border`}
                              >
                                {s.attendanceRate}%
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
