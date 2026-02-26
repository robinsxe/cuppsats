"use client";

import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";

interface RichEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  onWordCountChange?: (count: number) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichEditor({
  value,
  onValueChange,
  onWordCountChange,
  placeholder = "",
  minHeight = 400,
}: RichEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null);

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
          "bold italic underline | blocks | bullist numlist | blockquote | link | undo redo",
        block_formats: "Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4",
        content_style: `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 17px; line-height: 1.75; max-width: 65ch; margin: 0 auto; padding: 2rem 1.5rem; letter-spacing: 0.01em; } p { margin-bottom: 1.25em; } h2, h3, h4 { margin-top: 2em; margin-bottom: 0.75em; }`,
        skin_url: "/tinymce/skins/ui/oxide",
        content_css: "/tinymce/skins/content/default/content.min.css",
        icons_url: "/tinymce/icons/default/icons.min.js",
        icons: "default",
        branding: false,
        promotion: false,
      }}
      licenseKey="gpl"
    />
  );
}
