import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Nav from "@/components/Nav";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  return (
    <>
      <Nav username={session.username || ""} />
      <DashboardClient />
    </>
  );
}
