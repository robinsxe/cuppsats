"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, FileDown, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize";

interface ResearchRef {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  url: string | null;
  doi: string | null;
}

interface SectionData {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  content: string;
  researchLinks: {
    researchItem: ResearchRef;
  }[];
}

interface ThesisPreviewProps {
  sections: SectionData[];
}

interface FootnoteData {
  id: string;
  text: string;
}

function processFootnotes(
  html: string,
  startNumber: number
): { html: string; footnotes: FootnoteData[]; nextNumber: number } {
  const footnotes: FootnoteData[] = [];
  let counter = startNumber;
  const processed = html.replace(
    /<sup\s+class="footnote-ref"\s+data-footnote-id="([^"]*)"\s+data-footnote-text="([^"]*)"[^>]*>\[?\*?\]?<\/sup>/g,
    (_match, id: string, encodedText: string) => {
      const text = decodeURIComponent(encodedText);
      footnotes.push({ id, text });
      const num = counter++;
      return `<sup class="footnote-ref">${num}</sup>`;
    }
  );
  return { html: processed, footnotes, nextNumber: counter };
}

function formatHarvardReference(ref: ResearchRef): string {
  const parts: string[] = [];
  if (ref.authors) {
    parts.push(ref.authors);
  }
  if (ref.year) {
    parts.push(`(${ref.year})`);
  }
  if (ref.title) {
    parts.push(`<em>${ref.title}</em>`);
  }
  return parts.join(" ");
}

export function ThesisPreview({ sections }: ThesisPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    setPdfLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          filename: "uppsats.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(contentRef.current)
        .save();
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!contentRef.current) return;
    setDocxLoading(true);
    try {
      const response = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: contentRef.current.innerHTML }),
      });
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "uppsats.docx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDocxLoading(false);
    }
  };

  // Collect all unique references across all sections
  const refsMap = new Map<string, ResearchRef>();
  for (const section of sections) {
    for (const link of section.researchLinks) {
      refsMap.set(link.researchItem.id, link.researchItem);
    }
  }
  const allRefs = Array.from(refsMap.values()).sort((a, b) => {
    const authorCmp = a.authors.localeCompare(b.authors, "sv");
    if (authorCmp !== 0) return authorCmp;
    return (a.year ?? 0) - (b.year ?? 0);
  });

  // Filter out the "Referenslista" section — we'll auto-generate it
  const contentSections = sections.filter((s) => s.slug !== "referenslista");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1 ml-3">Förhandsgranska uppsats</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Skriv ut
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="gap-2"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Ladda ner PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadDocx}
            disabled={docxLoading}
            className="gap-2"
          >
            {docxLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Ladda ner DOCX
          </Button>
        </div>
      </div>

      <div
        ref={contentRef}
        className="thesis-preview rounded-lg border bg-white p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0"
      >
        <style>{`
          .thesis-preview {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.75;
            color: #1a1a1a;
          }
          .thesis-preview h2 {
            font-size: 16pt;
            font-weight: 700;
            margin-top: 2.5em;
            margin-bottom: 0.75em;
            page-break-after: avoid;
          }
          .thesis-preview h2:first-child {
            margin-top: 0;
          }
          .thesis-preview h3 {
            font-size: 13pt;
            font-weight: 600;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
          }
          .thesis-preview h4 {
            font-size: 12pt;
            font-weight: 600;
            margin-top: 1.25em;
            margin-bottom: 0.5em;
          }
          .thesis-preview p {
            margin-bottom: 0.75em;
            text-align: left;
          }
          .thesis-preview blockquote {
            margin: 1em 0 1em 2em;
            padding-left: 1em;
            border-left: 3px solid #d1d5db;
            font-style: italic;
          }
          .thesis-preview ul, .thesis-preview ol {
            margin: 0.75em 0;
            padding-left: 2em;
          }
          .thesis-preview li {
            margin-bottom: 0.25em;
          }
          .thesis-preview .section-divider {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 2em 0;
          }
          .thesis-preview .reference-list {
            margin-top: 0.5em;
          }
          .thesis-preview .reference-list li {
            margin-bottom: 0.5em;
            text-indent: -2em;
            padding-left: 2em;
          }
          .thesis-preview sup.footnote-ref {
            color: #2563eb;
            font-weight: 500;
          }
          .thesis-preview .footnotes-section {
            margin-top: 2em;
            padding-top: 1em;
            border-top: 1px solid #d1d5db;
            font-size: 10pt;
          }
          .thesis-preview .footnotes-section li {
            margin-bottom: 0.25em;
          }
          @media print {
            .thesis-preview h2 {
              page-break-before: always;
            }
            .thesis-preview h2:first-child {
              page-break-before: avoid;
            }
          }
        `}</style>

        {(() => {
          let footnoteCounter = 1;
          return contentSections.map((section, i) => {
            const { html: processedHtml, footnotes, nextNumber } = section.content
              ? processFootnotes(section.content, footnoteCounter)
              : { html: "", footnotes: [], nextNumber: footnoteCounter };
            const sectionFootnoteStart = footnoteCounter;
            footnoteCounter = nextNumber;

            return (
              <div key={section.id}>
                {i > 0 && <hr className="section-divider" />}
                <h2>{section.sortOrder}. {section.title}</h2>
                {processedHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedHtml) }} />
                ) : (
                  <p className="italic text-gray-400">Inget innehåll ännu.</p>
                )}
                {footnotes.length > 0 && (
                  <div className="footnotes-section">
                    <ol start={sectionFootnoteStart} className="list-decimal pl-6">
                      {footnotes.map((fn, idx) => (
                        <li key={fn.id} value={sectionFootnoteStart + idx}>
                          {fn.text}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          });
        })()}

        {/* Auto-generated reference list */}
        {allRefs.length > 0 && (
          <div>
            <hr className="section-divider" />
            <h2>{sections.length}. Referenslista</h2>
            <ol className="reference-list list-none">
              {allRefs.map((ref) => (
                <li key={ref.id}>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(formatHarvardReference(ref)),
                    }}
                  />
                  {ref.doi && (
                    <span className="text-gray-500"> doi:{ref.doi}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
