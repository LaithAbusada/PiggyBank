import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardPrefsProvider } from "@/lib/dashboard-prefs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardPrefsProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardPrefsProvider>
  );
}
