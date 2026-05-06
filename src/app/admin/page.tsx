import { isAuthenticated } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/login";
import { AdminDashboard } from "@/components/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAuthenticated();

  if (!authed) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
