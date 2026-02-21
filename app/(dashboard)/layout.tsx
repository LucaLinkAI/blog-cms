import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    // Determine the current pathname from request headers for redirect
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "/dashboard";
    redirect(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
  }

  return <>{children}</>;
}
