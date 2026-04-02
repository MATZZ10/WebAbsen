"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Download, FileDown, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendanceMapDialog } from "./attendance-map-dialog";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { formatDateTime, getAttendanceLabel, getAttendanceTone, toDateOnly } from "@/lib/attendance";
import { toast } from "sonner";

export type AttendanceRow = {
  id: string;
  studentName: string;
  className: string;
  status: "present" | "late" | "sick" | "alpa";
  attendedAt: string;
  faceImage?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  confidence?: number | null;
  note?: string | null;
};

type Props = {
  initialRows: AttendanceRow[];
  todaySummary: { present: number; late: number; sick: number; alpa: number };
};

export function AttendanceTable({ initialRows, todaySummary }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [sorting, setSorting] = useState<SortingState>([{ id: "attendedAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [mapTarget, setMapTarget] = useState<AttendanceRow | null>(null);

  const uniqueClasses = useMemo(() => Array.from(new Set(rows.map((r) => r.className))).sort(), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase());
      const matchDate = dateFilter ? toDateOnly(r.attendedAt) === dateFilter : true;
      const matchStatus = statusFilter === "all" ? true : r.status === statusFilter;
      const matchClass = classFilter === "all" ? true : r.className === classFilter;
      return matchSearch && matchDate && matchStatus && matchClass;
    });
  }, [rows, search, dateFilter, statusFilter, classFilter]);

  const columns: ColumnDef<AttendanceRow>[] = [
    {
      accessorKey: "studentName",
      header: "Siswa",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              {item.faceImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.faceImage} alt={item.studentName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No photo</div>
              )}
            </div>
            <div>
              <div className="font-medium text-white">{item.studentName}</div>
              <div className="text-xs text-slate-400">{item.className}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge className={getAttendanceTone(row.original.status)}>{getAttendanceLabel(row.original.status)}</Badge>,
    },
    {
      accessorKey: "attendedAt",
      header: "Waktu Absen",
      cell: ({ row }) => <span className="text-slate-200">{formatDateTime(row.original.attendedAt)}</span>,
    },
    {
      accessorKey: "confidence",
      header: "Confidence",
      cell: ({ row }) => {
        const confidence = row.original.confidence;
        if (typeof confidence !== "number") return <span className="text-slate-400">-</span>;
        return (
          <div className="min-w-[140px]">
            <div className="mb-1 text-xs text-slate-400">{confidence.toFixed(2)}%</div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.max(0, Math.min(100, confidence))}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const item = row.original;
        const overrideStatus = async (status: AttendanceRow["status"]) => {
          const res = await fetch(`/api/admin/attendance/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          if (!res.ok) {
            toast.error("Gagal memperbarui status");
            return;
          }
          const payload = await res.json();
          const updated = payload.data as AttendanceRow;
          setRows((prev) => prev.map((r) => (r.id === item.id ? { ...r, status: updated.status } : r)));
          toast.success("Status diperbarui");
        };

        return (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={() => setMapTarget(item)}>
              <MapPin className="mr-2 h-4 w-4" />
              Lihat Lokasi
            </Button>

            <Select onValueChange={(value) => overrideStatus(value as AttendanceRow["status"])}>
              <SelectTrigger className="h-9 w-[160px] border-white/10 bg-white/5">
                <SelectValue placeholder="Manual override" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Set as Present</SelectItem>
                <SelectItem value="late">Set as Late</SelectItem>
                <SelectItem value="sick">Set as Sick</SelectItem>
                <SelectItem value="alpa">Set as Alpa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.22)]"><CardContent className="p-5"><div className="text-sm text-slate-400">Hadir Hari Ini</div><div className="mt-1 text-3xl font-semibold tracking-tight text-white">{todaySummary.present}</div></CardContent></Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.22)]"><CardContent className="p-5"><div className="text-sm text-slate-400">Terlambat</div><div className="mt-1 text-3xl font-semibold tracking-tight text-white">{todaySummary.late}</div></CardContent></Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.22)]"><CardContent className="p-5"><div className="text-sm text-slate-400">Sakit</div><div className="mt-1 text-3xl font-semibold tracking-tight text-white">{todaySummary.sick}</div></CardContent></Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.22)]"><CardContent className="p-5"><div className="text-sm text-slate-400">Tanpa Keterangan</div><div className="mt-1 text-3xl font-semibold tracking-tight text-white">{todaySummary.alpa}</div></CardContent></Card>
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama siswa..." className="border-white/10 bg-white/5 pl-9" />
              </div>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border-white/10 bg-white/5" />
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="border-white/10 bg-white/5"><SelectValue placeholder="Filter kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {uniqueClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-white/10 bg-white/5"><SelectValue placeholder="Filter status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="present">Hadir</SelectItem>
                  <SelectItem value="late">Terlambat</SelectItem>
                  <SelectItem value="sick">Sakit</SelectItem>
                  <SelectItem value="alpa">Alpa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={() => exportToExcel(filteredRows)}>
                <Download className="mr-2 h-4 w-4" /> Export Excel
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={() => exportToPDF(filteredRows)}>
                <FileDown className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10">
            <Table>
              <TableHeader className="bg-white/5">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="border-white/10 hover:bg-transparent">
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} className="text-slate-300">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-white/10 transition-colors hover:bg-white/5">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-12 text-center text-slate-400">
                      Tidak ada data sesuai filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">Menampilkan {table.getRowModel().rows.length} data</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-slate-300">Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}</div>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AttendanceMapDialog
        open={!!mapTarget}
        onOpenChange={(open) => { if (!open) setMapTarget(null); }}
        studentName={mapTarget?.studentName}
        latitude={mapTarget?.latitude}
        longitude={mapTarget?.longitude}
      />
    </div>
  );
}
