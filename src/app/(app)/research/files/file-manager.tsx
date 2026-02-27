"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  Upload,
  Folder,
  FileText,
  Image,
  File as FileIcon,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFileSize, getFileCategory, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/file-utils";

interface FolderData {
  id: string;
  name: string;
  _count: { files: number };
}

interface FileData {
  id: string;
  name: string;
  blobUrl: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  createdAt: string;
  uploader: { id: string; name: string };
  folder: { id: string; name: string } | null;
}

interface FileManagerProps {
  initialFolders: FolderData[];
  initialFiles: FileData[];
}

function FileIcon2({ mimeType }: { mimeType: string }) {
  const category = getFileCategory(mimeType);
  if (category === "image") return <Image className="h-8 w-8 text-blue-500" />;
  if (category === "pdf") return <FileText className="h-8 w-8 text-red-500" />;
  if (category === "document") return <FileText className="h-8 w-8 text-green-500" />;
  return <FileIcon className="h-8 w-8 text-muted-foreground" />;
}

export function FileManager({ initialFolders, initialFiles }: FileManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [folders, setFolders] = useState<FolderData[]>(initialFolders);
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");

  const filteredFiles = selectedFolder
    ? files.filter((f) => f.folderId === selectedFolder)
    : files;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} är för stor (max 50 MB)`);
        continue;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        alert(`${file.name} — filtypen stöds inte`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);
      if (selectedFolder) formData.append("folderId", selectedFolder);

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newFile = await response.json();
        setFiles((prev) => [newFile, ...prev]);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;

    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const folder = await response.json();
      setFolders((prev) => [...prev, folder]);
      setNewFolderName("");
      setCreatingFolder(false);
    }
  }

  async function handleRenameFolder(id: string) {
    const name = editFolderName.trim();
    if (!name) return;

    const response = await fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const updated = await response.json();
      setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setEditingFolderId(null);
    }
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm("Radera mappen? Filerna flyttas till rot.")) return;

    const response = await fetch(`/api/folders/${id}`, { method: "DELETE" });
    if (response.ok) {
      setFolders((prev) => prev.filter((f) => f.id !== id));
      setFiles((prev) =>
        prev.map((f) => (f.folderId === id ? { ...f, folderId: null, folder: null } : f))
      );
      if (selectedFolder === id) setSelectedFolder(null);
    }
  }

  async function handleMoveFile(fileId: string, folderId: string | null) {
    const response = await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });

    if (response.ok) {
      const updated = await response.json();
      setFiles((prev) => prev.map((f) => (f.id === fileId ? updated : f)));
    }
  }

  async function handleDeleteFile(fileId: string) {
    if (!confirm("Radera filen permanent?")) return;

    const response = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    if (response.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Folder sidebar */}
      <div className="w-full md:w-56 space-y-2 shrink-0">
        <Button
          variant={selectedFolder === null ? "default" : "ghost"}
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setSelectedFolder(null)}
        >
          <Folder className="h-4 w-4" />
          Alla filer
          <Badge variant="secondary" className="ml-auto text-xs">
            {files.length}
          </Badge>
        </Button>

        {folders.map((folder) =>
          editingFolderId === folder.id ? (
            <div key={folder.id} className="flex gap-1">
              <Input
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameFolder(folder.id);
                  if (e.key === "Escape") setEditingFolderId(null);
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRenameFolder(folder.id)}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingFolderId(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div key={folder.id} className="flex items-center group">
              <Button
                variant={selectedFolder === folder.id ? "default" : "ghost"}
                size="sm"
                className="flex-1 justify-start gap-2"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <Folder className="h-4 w-4" />
                <span className="truncate">{folder.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {folder._count.files}
                </Badge>
              </Button>
              <div className="hidden group-hover:flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingFolderId(folder.id);
                    setEditFolderName(folder.name);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-destructive"
                  onClick={() => handleDeleteFolder(folder.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        )}

        {creatingFolder ? (
          <div className="flex gap-1">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Mappnamn..."
              className="h-8 text-sm"
              autoFocus
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") setCreatingFolder(false);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCreateFolder}
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setCreatingFolder(true)}
          >
            <FolderPlus className="h-4 w-4" />
            Ny mapp
          </Button>
        )}
      </div>

      {/* File grid */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept={ALLOWED_MIME_TYPES.join(",")}
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Laddar upp..." : "Ladda upp filer"}
          </Button>
        </div>

        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Inga filer{selectedFolder ? " i denna mapp" : " ännu"}. Ladda upp filer ovan.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                  <Link
                    href={`/research/files/${file.id}`}
                    className="flex items-start gap-3"
                  >
                    {getFileCategory(file.mimeType) === "image" ? (
                      <img
                        src={file.blobUrl}
                        alt={file.name}
                        className="h-12 w-12 rounded object-cover shrink-0"
                      />
                    ) : (
                      <FileIcon2 mimeType={file.mimeType} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} ·{" "}
                        {new Date(file.createdAt).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Select
                      value={file.folderId ?? "__root__"}
                      onValueChange={(v) =>
                        handleMoveFile(file.id, v === "__root__" ? null : v)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="Mapp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__root__">Utan mapp</SelectItem>
                        {folders.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
