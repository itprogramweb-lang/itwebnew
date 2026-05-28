"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eye,
  EyeOff,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Underline as UnderlineIcon,
} from "lucide-react";
import NewsContentRenderer from "@/components/news/NewsContentRenderer";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
};

type LinkState = {
  open: boolean;
  url: string;
};

type ImgState = {
  open: boolean;
  url: string;
  fitMode: "cover" | "contain";
  posX: number;
  posY: number;
  zoom: number;
};

type TextAlign = "left" | "center" | "right";

type ActiveFormats = {
  h1: boolean;
  h2: boolean;
  h3: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  ul: boolean;
  ol: boolean;
  quote: boolean;
  align: TextAlign;
};

const DEFAULT_ACTIVE_FORMATS: ActiveFormats = {
  h1: false,
  h2: false,
  h3: false,
  bold: false,
  italic: false,
  underline: false,
  ul: false,
  ol: false,
  quote: false,
  align: "left",
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "เขียนเนื้อหาข่าวที่นี่...",
  minHeight = 320,
  maxHeight,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtml = useRef("");

  const [preview, setPreview] = useState(false);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(DEFAULT_ACTIVE_FORMATS);

  const [link, setLink] = useState<LinkState>({
    open: false,
    url: "",
  });

  const [img, setImg] = useState<ImgState>({
    open: false,
    url: "",
    fitMode: "cover",
    posX: 50,
    posY: 50,
    zoom: 1,
  });

  useEffect(() => {
    const next = value ?? "";

    if (!preview && editorRef.current) {
      if (editorRef.current.innerHTML !== next) {
        editorRef.current.innerHTML = next;
      }

      lastHtml.current = next;
    }
  }, [value, preview]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const getSelectedElement = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return null;

    const anchorNode = selection.anchorNode;

    if (!anchorNode || !editor.contains(anchorNode)) return null;

    const element =
      anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.parentElement
        : anchorNode instanceof HTMLElement
          ? anchorNode
          : null;

    if (!element || !editor.contains(element)) return null;

    return element;
  }, []);

  const getSelectedBlock = useCallback(() => {
    const editor = editorRef.current;
    const element = getSelectedElement();

    if (!editor || !element) return null;

    const block = element.closest(
      "p,h1,h2,h3,h4,h5,h6,blockquote,li,div"
    ) as HTMLElement | null;

    if (!block || !editor.contains(block)) return null;
    if (block === editor) return null;

    return block;
  }, [getSelectedElement]);

  const getBlockAlign = (block: HTMLElement | null): TextAlign => {
    if (!block) return "left";

    const inlineAlign = block.style.textAlign;

    if (inlineAlign === "center" || inlineAlign === "right" || inlineAlign === "left") {
      return inlineAlign;
    }

    const computedAlign = window.getComputedStyle(block).textAlign;

    if (computedAlign === "center") return "center";
    if (computedAlign === "right" || computedAlign === "end") return "right";

    return "left";
  };

  const updateActiveFormats = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      setActiveFormats(DEFAULT_ACTIVE_FORMATS);
      return;
    }

    const anchorNode = selection.anchorNode;

    if (!anchorNode || !editor.contains(anchorNode)) {
      setActiveFormats(DEFAULT_ACTIVE_FORMATS);
      return;
    }

    const block = getSelectedBlock();
    const tagName = block?.tagName.toLowerCase();

    setActiveFormats({
      h1: tagName === "h1",
      h2: tagName === "h2",
      h3: tagName === "h3",
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
      quote: tagName === "blockquote",
      align: getBlockAlign(block),
    });
  }, [getSelectedBlock]);

  const sync = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";

    updateActiveFormats();

    if (html !== lastHtml.current) {
      lastHtml.current = html;
      onChange(html);
    }
  }, [onChange, updateActiveFormats]);

  const exec = (cmd: string, val?: string) => {
    focusEditor();
    document.execCommand(cmd, false, val);
    sync();
  };

  const insertHtml = (html: string) => {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    sync();
  };

  const execBlock = (tag: "h1" | "h2" | "h3" | "p" | "blockquote") => {
    focusEditor();

    const block = getSelectedBlock();
    const currentTag = block?.tagName.toLowerCase();

    if (currentTag === tag && tag !== "p") {
      document.execCommand("formatBlock", false, "p");
    } else {
      document.execCommand("formatBlock", false, tag);
    }

    sync();
  };

  const applyTextAlign = (align: TextAlign) => {
    focusEditor();

    const block = getSelectedBlock();
    const currentAlign = getBlockAlign(block);
    const nextAlign: TextAlign = currentAlign === align && align !== "left" ? "left" : align;

    const command =
      nextAlign === "center"
        ? "justifyCenter"
        : nextAlign === "right"
          ? "justifyRight"
          : "justifyLeft";

    document.execCommand(command, false);

    const nextBlock = getSelectedBlock();

    if (nextBlock) {
      nextBlock.style.textAlign = nextAlign;
    }

    sync();
  };

  const setTextColor = (color: string) => {
    if (!color) return;
    exec("foreColor", color);
  };

  const setBackgroundColor = (color: string) => {
    if (!color) return;
    exec("hiliteColor", color);
  };

  const insertLink = () => {
    if (!link.url.trim()) return;

    focusEditor();

    const url = link.url.trim();

    if (!/^https?:\/\//i.test(url) && !url.startsWith("/") && !url.startsWith("mailto:")) {
      return;
    }

    document.execCommand("createLink", false, url);
    sync();

    setLink({
      open: false,
      url: "",
    });
  };

  const insertImage = () => {
    if (!img.url.trim()) return;

    const url = img.url.trim();

    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      return;
    }

    const safeUrl = url.replace(/"/g, "&quot;");
    const fit = img.fitMode === "contain" ? "contain" : "cover";
    const posX = Math.max(0, Math.min(100, img.posX));
    const posY = Math.max(0, Math.min(100, img.posY));
    const zoom = Math.max(1, Math.min(3, img.zoom));

    insertHtml(
      `<figure><span class="news-crop-frame" style="display:block;aspect-ratio:16/9;overflow:hidden;border-radius:16px;background:#f1f5f9;"><img src="${safeUrl}" alt="" style="width:100%;height:100%;object-fit:${fit};object-position:${posX}% ${posY}%;transform:${
        fit === "cover" && zoom > 1 ? `scale(${zoom})` : "none"
      };transform-origin:${posX}% ${posY}%;margin:0;border-radius:0;box-shadow:none;" /></span><figcaption></figcaption></figure><p></p>`
    );

    setImg({
      open: false,
      url: "",
      fitMode: "cover",
      posX: 50,
      posY: 50,
      zoom: 1,
    });
  };

  const editorMaxHeight = maxHeight ?? Math.max(minHeight, 650);

  const ToolBtn = ({
    onClick,
    title,
    children,
    active = false,
  }: {
    onClick: () => void;
    title: string;
    children: ReactNode;
    active?: boolean;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
        active
          ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );

  const Sep = () => <div className="mx-0.5 h-5 w-px bg-slate-200" />;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 p-2 shadow-sm">
        <ToolBtn
          onClick={() => execBlock("h1")}
          title="หัวข้อหลัก (H1)"
          active={activeFormats.h1}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => execBlock("h2")}
          title="หัวข้อใหญ่ (H2)"
          active={activeFormats.h2}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => execBlock("h3")}
          title="หัวข้อรอง (H3)"
          active={activeFormats.h3}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn onClick={() => execBlock("p")} title="ย่อหน้า">
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolBtn>

        <label
          title="สีข้อความ"
          onMouseDown={(e) => e.preventDefault()}
          className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-slate-600 transition hover:bg-slate-100"
        >
          สี
          <input
            type="color"
            defaultValue="#111827"
            onChange={(e) => setTextColor(e.target.value)}
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>

        <label
          title="สีพื้นหลังข้อความ"
          onMouseDown={(e) => e.preventDefault()}
          className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-slate-600 transition hover:bg-slate-100"
        >
          พื้นหลัง
          <input
            type="color"
            defaultValue="#fff7ed"
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>

        <Sep />

        <ToolBtn
          onClick={() => exec("bold")}
          title="ตัวหนา (Ctrl+B)"
          active={activeFormats.bold}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => exec("italic")}
          title="ตัวเอียง (Ctrl+I)"
          active={activeFormats.italic}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => exec("underline")}
          title="ขีดเส้นใต้ (Ctrl+U)"
          active={activeFormats.underline}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>

        <Sep />

        <ToolBtn
          onClick={() => exec("insertUnorderedList")}
          title="รายการหัวข้อย่อย"
          active={activeFormats.ul}
        >
          <List className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => exec("insertOrderedList")}
          title="รายการตัวเลข"
          active={activeFormats.ol}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => execBlock("blockquote")}
          title="บล็อกโควต"
          active={activeFormats.quote}
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn onClick={() => exec("insertHorizontalRule")} title="เส้นคั่น">
          <Minus className="h-3.5 w-3.5" />
        </ToolBtn>

        <Sep />

        <ToolBtn
          onClick={() => applyTextAlign("left")}
          title="จัดซ้าย"
          active={activeFormats.align === "left"}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => applyTextAlign("center")}
          title="จัดกลาง"
          active={activeFormats.align === "center"}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => applyTextAlign("right")}
          title="จัดขวา"
          active={activeFormats.align === "right"}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>

        <Sep />

        <ToolBtn
          onClick={() => setLink((s) => ({ ...s, open: !s.open }))}
          title="แทรก Link"
          active={link.open}
        >
          <Link2 className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => setImg((s) => ({ ...s, open: !s.open }))}
          title="แทรกรูปภาพ"
          active={img.open}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => {
              sync();
              setPreview((p) => !p);
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600"
          >
            {preview ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {preview ? "แก้ไข" : "Preview"}
          </button>
        </div>
      </div>

      {/* Link input bar */}
      {link.open && (
        <div className="flex items-center gap-2 border-b border-slate-100 bg-amber-50 px-3 py-2">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />

          <input
            type="url"
            placeholder="https://..."
            value={link.url}
            onChange={(e) => setLink((s) => ({ ...s, url: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") insertLink();
            }}
            className="flex-1 bg-transparent text-sm outline-none"
            autoFocus
          />

          <button
            type="button"
            onClick={insertLink}
            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700"
          >
            แทรก
          </button>

          <button
            type="button"
            onClick={() => setLink({ open: false, url: "" })}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* Image URL input bar */}
      {img.open && (
        <div className="flex items-center gap-2 border-b border-slate-100 bg-sky-50 px-3 py-2">
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="flex-1 space-y-2">
            <input
              type="url"
              placeholder="https://... (URL รูปภาพ)"
              value={img.url}
              onChange={(e) => setImg((s) => ({ ...s, url: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") insertImage();
              }}
              className="w-full bg-transparent text-sm outline-none"
              autoFocus
            />

            <div className="grid gap-2 sm:grid-cols-4">
              <select
                value={img.fitMode}
                onChange={(e) =>
                  setImg((s) => ({
                    ...s,
                    fitMode: e.target.value === "contain" ? "contain" : "cover",
                  }))
                }
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
              </select>

              <MiniRange
                label="X"
                value={img.posX}
                min={0}
                max={100}
                onChange={(v) => setImg((s) => ({ ...s, posX: v }))}
              />

              <MiniRange
                label="Y"
                value={img.posY}
                min={0}
                max={100}
                onChange={(v) => setImg((s) => ({ ...s, posY: v }))}
              />

              <MiniRange
                label="Zoom"
                value={Math.round(img.zoom * 100)}
                min={100}
                max={300}
                onChange={(v) => setImg((s) => ({ ...s, zoom: v / 100 }))}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={insertImage}
            className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700"
          >
            แทรก
          </button>

          <button
            type="button"
            onClick={() =>
              setImg({
                open: false,
                url: "",
                fitMode: "cover",
                posX: 50,
                posY: 50,
                zoom: 1,
              })
            }
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* Editor / Preview */}
      <div
        className="overflow-y-auto"
        style={{
          minHeight,
          maxHeight: editorMaxHeight,
        }}
      >
        {preview ? (
          <div className="px-5 py-4" style={{ minHeight }}>
            <NewsContentRenderer html={lastHtml.current} emptyText={placeholder} />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={sync}
            onBlur={sync}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            onFocus={updateActiveFormats}
            data-placeholder={placeholder}
            className="rich-editor-body news-body px-5 py-4"
            style={{ minHeight }}
          />
        )}
      </div>
    </div>
  );
}

function MiniRange({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-[10px] text-slate-500">
      {label}

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-brand-500"
      />
    </label>
  );
}