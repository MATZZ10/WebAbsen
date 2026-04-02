"use client";
import { useState } from "react";

export function useAttendance() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  async function submit(payload: any) {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
      return data;
    } finally {
      setLoading(false);
    }
  }
  return { loading, result, submit };
}
