export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import { TeacherHeader } from "./_components/TeacherHeader";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader profile={profile} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
