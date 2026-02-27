import { prisma } from "@/lib/prisma";
import { ResearchTabs } from "../research-tabs";
import { FileManager } from "./file-manager";

export default async function FilesPage() {
  const [folders, files] = await Promise.all([
    prisma.researchFolder.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { files: true } } },
    }),
    prisma.researchFile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        uploader: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <ResearchTabs />
      <div>
        <h1 className="text-2xl font-bold">Filer</h1>
        <p className="text-muted-foreground">
          Ladda upp och organisera forskningsfiler
        </p>
      </div>
      <FileManager
        initialFolders={JSON.parse(JSON.stringify(folders))}
        initialFiles={JSON.parse(JSON.stringify(files))}
      />
    </div>
  );
}
