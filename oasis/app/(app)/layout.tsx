import { AuthGuard } from "@/components/nav/AuthGuard";
import { Sidebar } from "@/components/nav/Sidebar";
import { TopBar } from "@/components/nav/TopBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <Sidebar />
        <TopBar />
        <div className="md:pl-60">{children}</div>
      </div>
    </AuthGuard>
  );
}
