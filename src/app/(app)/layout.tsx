import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThesisProgressBar } from "@/components/progress-bar";
import { type SectionStatus } from "@/lib/constants";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const sections = await prisma.section.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, title: true, status: true },
  });

  const typedSections = sections.map((s) => ({
    ...s,
    status: s.status as SectionStatus,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav
        userName={session.user.name}
        userRole={session.user.role}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-background px-6 py-3">
          <ThesisProgressBar sections={typedSections} />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
