import { SidebarAdmin } from "@/components/admin/sidebar-admin";
import DeviceLockGate from "@/components/device-lock-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DeviceLockGate />
      <SidebarAdmin>{children}</SidebarAdmin>
    </>
  );
}
