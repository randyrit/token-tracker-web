import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Nav from "@/components/Nav";
import UploadClient from "@/components/UploadClient";

export default async function UploadPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  return (
    <>
      <Nav username={session.username || ""} />
      <UploadClient />
    </>
  );
}
