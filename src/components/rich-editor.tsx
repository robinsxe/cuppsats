"use client";

import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";

export interface CitationSource {
  id: string;
  authors: string;
  year: number | null;
  title: string;
}

interface RichEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  onWordCountChange?: (count: number) => void;
  citations?: CitationSource[];
  placeholder?: string;
  minHeight?: number;
}

export function RichEditor({
  value,
  onValueChange,
  onWordCountChange,
  citations,
  placeholder = "",
  minHeight = 400,
}: RichEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const citationsRef = useRef(citations);
  citationsRef.current = citations;

  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      onInit={(_evt, editor) => {
        editorRef.current = editor;
      }}
      value={value}
      onEditorChange={(newValue, editor) => {
        onValueChange(newValue);
        if (onWordCountChange) {
          const count = editor.plugins.wordcount.body.getWordCount();
          onWordCountChange(count);
        }
      }}
      init={{
        placeholder,
        min_height: minHeight,
        menubar: false,
        statusbar: false,
        plugins: "lists link autolink wordcount",
        toolbar:
          "bold italic underline | blocks | bullist numlist | blockquote | link | insertcitation insertnote | undo redo",
        block_formats: "Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4",
        content_style: `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 17px; line-height: 1.75; max-width: 65ch; margin: 0 auto; padding: 2rem 1.5rem; letter-spacing: 0.01em; } p { margin-bottom: 1.25em; } h2, h3, h4 { margin-top: 2em; margin-bottom: 0.75em; } span.citation { background: #eff6ff; border-radius: 3px; padding: 0 2px; color: #1d4ed8; } sup.footnote-ref { color: #2563eb; cursor: default; font-weight: 600; }`,
        skin_url: "/tinymce/skins/ui/oxide",
        content_css: "/tinymce/skins/content/default/content.min.css",
        icons_url: "/tinymce/icons/default/icons.min.js",
        icons: "default",
        branding: false,
        promotion: false,
        setup: (editor) => {
          // Citation insertion button
          editor.ui.registry.addMenuButton("insertcitation", {
            text: "Referens",
            tooltip: "Infoga referens (Harvard)",
            fetch: (callback) => {
              const sources = citationsRef.current ?? [];
              if (sources.length === 0) {
                callback([
                  {
                    type: "menuitem",
                    text: "Inga källor länkade",
                    enabled: false,
                    onAction: () => {},
                  },
                ]);
                return;
              }
              const items = sources.map((src) => ({
                type: "menuitem" as const,
                text: `${src.authors || "Okänd"}${src.year ? ` (${src.year})` : ""} — ${src.title}`,
                onAction: () => {
                  const lastNamePart = src.authors
                    ? src.authors.split(",")[0].trim()
                    : "Okänd";
                  const cite = src.year
                    ? `(${lastNamePart}, ${src.year})`
                    : `(${lastNamePart})`;
                  editor.insertContent(
                    `<span class="citation" data-citation-id="${src.id}">${cite}</span>&nbsp;`
                  );
                },
              }));
              callback(items);
            },
          });

          // Footnote insertion button
          editor.ui.registry.addButton("insertnote", {
            text: "Fotnot",
            tooltip: "Infoga fotnot",
            onAction: () => {
              editor.windowManager.open({
                title: "Infoga fotnot",
                body: {
                  type: "panel",
                  items: [
                    {
                      type: "textarea",
                      name: "notetext",
                      label: "Fotnotstext",
                    },
                  ],
                },
                buttons: [
                  { type: "cancel", text: "Avbryt" },
                  { type: "submit", text: "Infoga", buttonType: "primary" },
                ],
                onSubmit: (dialog) => {
                  const data = dialog.getData() as { notetext: string };
                  if (data.notetext.trim()) {
                    const id = `fn-${Date.now()}`;
                    editor.insertContent(
                      `<sup class="footnote-ref" data-footnote-id="${id}" data-footnote-text="${encodeURIComponent(data.notetext.trim())}">[*]</sup>`
                    );
                  }
                  dialog.close();
                },
              });
            },
          });
        },
      }}
      licenseKey="gpl"
    />
  );
}
