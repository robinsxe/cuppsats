"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CommentList } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";
import { formatFileSize, getFileCategory } from "@/lib/file-utils";

interface ReplyData {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  author: { id: string; name: string; role: string };
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  author: { id: string; name: string; role: string };
  replies: ReplyData[];
}

interface FileData {
  id: string;
  name: string;
  blobUrl: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  createdAt: string;
  uploader: { id: string; name: string; role: string };
  folder: { id: string; name: string } | null;
  comments: CommentData[];
}

interface FolderOption {
  id: string;
  name: string;
}

interface FileDetailProps {
  file: FileData;
  folders: FolderOption[];
  currentUserId: string;
}

function FilePreview({ file }: { file: FileData }) {
  const category = getFileCategory(file.mimeType);

  if (category === "image") {
    return (
      <div className="flex justify-center bg-muted/30 rounded-lg p-4">
        <img
          src={file.blobUrl}
          alt={file.name}
          className="max-h-[500px] max-w-full rounded object-contain"
        />
      </div>
    );
  }

  if (category === "pdf") {
    return (
      <iframe
        src={file.blobUrl}
        className="w-full h-[600px] rounded-lg border"
        title={file.name}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-12 bg-muted/30 rounded-lg">
      <div className="text-4xl">📄</div>
      <p className="text-sm text-muted-foreground">
        Förhandsvisning inte tillgänglig för {file.mimeType}
      </p>
    </div>
  );
}

export function FileDetail({ file, folders, currentUserId }: FileDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    parentId: string;
    quotedText: string;
  } | null>(null);

  async function handleDelete() {
    if (!confirm("Radera filen permanent?")) return;
    setDeleting(true);

    const response = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/research/files");
    }
    setDeleting(false);
  }

  async function handleMoveFolder(folderId: string) {
    await fetch(`/api/files/${file.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: folderId === "__root__" ? null : folderId }),
    });
    router.refresh();
  }

  const comments = file.comments.map((c) => ({
    ...c,
    createdAt: new Date(c.createdAt),
    replies: c.replies.map((r) => ({ ...r, createdAt: new Date(r.createdAt) })),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/research/files">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1 truncate">{file.name}</h1>
        <div className="flex gap-2">
          <a href={file.blobUrl} download={file.name}>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Ladda ner
            </Button>
          </a>
          <a href={file.blobUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Öppna
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Radera
          </Button>
        </div>
      </div>

      {/* Preview */}
      <FilePreview file={file} />

      {/* Metadata + move */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Storlek:</span>{" "}
              {formatFileSize(file.size)}
            </div>
            <div>
              <span className="text-muted-foreground">Typ:</span>{" "}
              {file.mimeType}
            </div>
            <div>
              <span className="text-muted-foreground">Uppladdat:</span>{" "}
              {new Date(file.createdAt).toLocaleDateString("sv-SE", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div>
              <span className="text-muted-foreground">Av:</span>{" "}
              {file.uploader.name}
              <Badge variant="outline" className="ml-1 text-xs">
                {file.uploader.role === "owner" ? "Student" : "Handledare"}
              </Badge>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mapp:</span>
            <Select
              value={file.folderId ?? "__root__"}
              onValueChange={handleMoveFolder}
            >
              <SelectTrigger className="h-8 w-[200px] text-sm">
                <SelectValue />
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
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kommentarer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CommentList
            comments={comments}
            currentUserId={currentUserId}
            onReply={(parentId, quotedText) =>
              setReplyTo({ parentId, quotedText })
            }
          />
          <CommentForm
            researchFileId={file.id}
            parentId={replyTo?.parentId}
            quotedText={replyTo?.quotedText}
            onCancel={replyTo ? () => setReplyTo(null) : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
