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
  Table,
  Upload,
  Underline as UnderlineIcon,
} from "lucide-react";
import NewsContentRenderer from "@/components/news/NewsContentRenderer";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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
  width: number;
  align: "left" | "center" | "right";
  radius: number;
};

type TableState = {
  open: boolean;
  rows: number;
  cols: number;
  hasHeader: boolean;
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

const DEFAULT_IMAGE_STATE: ImgState = {
  open: false,
  url: "",
  fitMode: "cover",
  posX: 50,
  posY: 50,
  zoom: 1,
  width: 100,
  align: "center",
  radius: 16,
};

const DEFAULT_TABLE_STATE: TableState = {
  open: false,
  rows: 3,
  cols: 3,
  hasHeader: true,
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "เขียนเนื้อหาข่าวที่นี่...",
  minHeight = 320,
  maxHeight,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastHtml = useRef("");
  const savedRangeRef = useRef<Range | null>(null);

  const [preview, setPreview] = useState(false);
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(DEFAULT_ACTIVE_FORMATS);

  const [link, setLink] = useState<LinkState>({
    open: false,
    url: "",
  });

  const [img, setImg] = useState<ImgState>(DEFAULT_IMAGE_STATE);
  const [table, setTable] = useState<TableState>(DEFAULT_TABLE_STATE);

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

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) return;

    savedRangeRef.current = range.cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection) return false;

    const savedRange = savedRangeRef.current;

    if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
      return true;
    }

    return false;
  }, []);

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
    const restored = restoreSelection();

    if (!restored) {
      focusEditor();
    }

    document.execCommand(cmd, false, val);
    sync();
    saveSelection();
  };

  const insertHtml = (html: string) => {
    const restored = restoreSelection();

    if (!restored) {
      focusEditor();
    }

    document.execCommand("insertHTML", false, html);
    sync();
    saveSelection();
  };

  const execBlock = (tag: "h1" | "h2" | "h3" | "p" | "blockquote") => {
    const restored = restoreSelection();

    if (!restored) {
      focusEditor();
    }

    const block = getSelectedBlock();
    const currentTag = block?.tagName.toLowerCase();

    if (currentTag === tag && tag !== "p") {
      document.execCommand("formatBlock", false, "p");
    } else {
      document.execCommand("formatBlock", false, tag);
    }

    sync();
    saveSelection();
  };

  const applyTextAlign = (align: TextAlign) => {
    const restored = restoreSelection();

    if (!restored) {
      focusEditor();
    }

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
    saveSelection();
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

    const restored = restoreSelection();
    if (!restored) {
      focusEditor();
    }

    const url = link.url.trim();

    if (!/^https?:\/\//i.test(url) && !url.startsWith("/") && !url.startsWith("mailto:")) {
      return;
    }

    document.execCommand("createLink", false, url);
    sync();
    saveSelection();

    setLink({
      open: false,
      url: "",
    });
  };

  const resetImageState = () => {
    setImg(DEFAULT_IMAGE_STATE);
  };

  const buildImageHtml = (imageUrl: string) => {
    const safeUrl = imageUrl.replace(/"/g, "&quot;");
    const fit = img.fitMode === "contain" ? "contain" : "cover";
    const posX = Math.max(0, Math.min(100, img.posX));
    const posY = Math.max(0, Math.min(100, img.posY));
    const zoom = Math.max(1, Math.min(3, img.zoom));
    const width = Math.max(20, Math.min(100, img.width));
    const radius = Math.max(0, Math.min(40, img.radius));

    const figureAlign =
      img.align === "left"
        ? "margin-left:0;margin-right:auto;"
        : img.align === "right"
          ? "margin-left:auto;margin-right:0;"
          : "margin-left:auto;margin-right:auto;";

    return `
      <figure style="width:${width}%;max-width:100%;${figureAlign}" contenteditable="false">
        <div style="width:100%;overflow:hidden;border-radius:${radius}px;">
          <img
            src="${safeUrl}"
            alt=""
            style="width:100%;height:auto;display:block;object-fit:${fit};object-position:${posX}% ${posY}%;transform:scale(${zoom});transform-origin:${posX}% ${posY}%;box-shadow:none;"
          />
        </div>
        <figcaption></figcaption>
      </figure><p><br></p>
    `;
  };

  const insertImage = () => {
    if (!img.url.trim()) return;

    const url = img.url.trim();

    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      alert("URL รูปภาพต้องขึ้นต้นด้วย https:// หรือ /");
      return;
    }

    restoreSelection();
    insertHtml(buildImageHtml(url));
    resetImageState();
  };

  const insertTable = () => {
    restoreSelection();

    const rows = Math.max(1, Math.min(20, Number(table.rows) || 1));
    const cols = Math.max(1, Math.min(10, Number(table.cols) || 1));

    const tableRows = Array.from({ length: rows }, (_, rowIndex) => {
      const cells = Array.from({ length: cols }, (_, colIndex) => {
        const isHeader = table.hasHeader && rowIndex === 0;

        if (isHeader) {
          return `<th>หัวข้อ ${colIndex + 1}</th>`;
        }

        return `<td>ข้อมูล</td>`;
      }).join("");

      return `<tr>${cells}</tr>`;
    }).join("");

    insertHtml(`
      <div class="news-table-scroll" contenteditable="false">
        <table style="width:100%;">
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div><p><br></p>
    `);

    setTable(DEFAULT_TABLE_STATE);
  };

  const uploadAndInsertImage = async (file: File) => {
    saveSelection();

    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

    if (!ALLOWED.includes(file.type)) {
      alert("ไฟล์ต้องเป็น JPG, PNG หรือ WebP เท่านั้น");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    const supabase = createBrowserSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "news/content");

    const res = await fetch("/api/admin/cloudinary/upload", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    let data: { secure_url?: string; url?: string; error?: string } = {};

    try {
      data = await res.json();
    } catch {
      alert("API อัปโหลดรูปไม่ได้ส่ง JSON กลับมา");
      return;
    }

    const imageUrl = data.secure_url || data.url;

    if (!res.ok || !imageUrl) {
      alert(data.error || "อัปโหลดรูปไม่สำเร็จ");
      return;
    }

    setImg((s) => ({
      ...s,
      open: true,
      url: String(imageUrl),
    }));
  };

  const editorMaxHeight = maxHeight ?? Math.max(minHeight, 650);

  const controlSelectionHandlers = {
    onPointerDownCapture: () => saveSelection(),
    onMouseDownCapture: () => saveSelection(),
    onFocusCapture: () => saveSelection(),
    onBlurCapture: () => saveSelection(),
  };

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
        saveSelection();
      }}
      onClick={() => {
        restoreSelection();
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

        <ToolBtn
          onClick={() => {
            saveSelection();
            setTable((s) => ({ ...s, open: !s.open }));
          }}
          title="แทรกตาราง"
          active={table.open}
        >
          <Table className="h-3.5 w-3.5" />
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
          onClick={() => {
            saveSelection();
            setLink((s) => ({ ...s, open: !s.open }));
          }}
          title="แทรก Link"
          active={link.open}
        >
          <Link2 className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => {
            saveSelection();
            setImg((s) => ({ ...s, open: !s.open }));
          }}
          title="แทรกรูปภาพ"
          active={img.open}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolBtn>

        <ToolBtn
          onClick={() => {
            saveSelection();
            fileInputRef.current?.click();
          }}
          title="อัปโหลดรูปภาพ"
        >
          <Upload className="h-3.5 w-3.5" />
        </ToolBtn>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAndInsertImage(file);
            e.currentTarget.value = "";
          }}
        />

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

      {/* Table input bar */}
      {table.open && (
        <div
          className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-emerald-50 px-3 py-2"
          {...controlSelectionHandlers}
        >
          <Table className="h-3.5 w-3.5 shrink-0 text-slate-400" />

          <label className="flex items-center gap-1 text-xs text-slate-600">
            แถว
            <input
              type="number"
              min={1}
              max={20}
              value={table.rows}
              onChange={(e) =>
                setTable((s) => ({
                  ...s,
                  rows: Number(e.target.value),
                }))
              }
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-emerald-400"
            />
          </label>

          <label className="flex items-center gap-1 text-xs text-slate-600">
            คอลัมน์
            <input
              type="number"
              min={1}
              max={10}
              value={table.cols}
              onChange={(e) =>
                setTable((s) => ({
                  ...s,
                  cols: Number(e.target.value),
                }))
              }
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-emerald-400"
            />
          </label>

          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={table.hasHeader}
              onChange={(e) =>
                setTable((s) => ({
                  ...s,
                  hasHeader: e.target.checked,
                }))
              }
              className="accent-emerald-500"
            />
            แถวแรกเป็นหัวตาราง
          </label>

          <button
            type="button"
            onClick={insertTable}
            className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            แทรก
          </button>

          <button
            type="button"
            onClick={() => setTable(DEFAULT_TABLE_STATE)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* Link input bar */}
      {link.open && (
        <div
          className="flex items-center gap-2 border-b border-slate-100 bg-amber-50 px-3 py-2"
          {...controlSelectionHandlers}
        >
          <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />

          <input
            type="url"
            placeholder="https://..."
            value={link.url}
            onChange={(e) => {
              saveSelection();
              setLink((s) => ({ ...s, url: e.target.value }));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") insertLink();
            }}
            className="flex-1 bg-transparent text-sm outline-none"
            autoFocus
          />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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
        <div
          className="flex items-start gap-2 border-b border-slate-100 bg-sky-50 px-3 py-2"
          {...controlSelectionHandlers}
        >
          <ImageIcon className="mt-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

          <div className="flex-1 space-y-2">
            <input
              type="url"
              placeholder="https://... (URL รูปภาพ)"
              value={img.url}
              onChange={(e) => {
                saveSelection();
                setImg((s) => ({ ...s, url: e.target.value }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") insertImage();
              }}
              className="w-full bg-transparent text-sm outline-none"
              autoFocus
            />

            <div className="grid gap-2 sm:grid-cols-7">
              <select
                value={img.fitMode}
                onChange={(e) => {
                  saveSelection();
                  setImg((s) => ({
                    ...s,
                    fitMode: e.target.value === "contain" ? "contain" : "cover",
                  }));
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
              </select>

              <select
                value={img.width}
                onChange={(e) => {
                  saveSelection();
                  setImg((s) => ({
                    ...s,
                    width: Number(e.target.value),
                  }));
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value={100}>ขนาด 100%</option>
                <option value={80}>ขนาด 80%</option>
                <option value={60}>ขนาด 60%</option>
                <option value={40}>ขนาด 40%</option>
                <option value={25}>ขนาด 25%</option>
              </select>

              <select
                value={img.align}
                onChange={(e) => {
                  saveSelection();
                  setImg((s) => ({
                    ...s,
                    align:
                      e.target.value === "left"
                        ? "left"
                        : e.target.value === "right"
                          ? "right"
                          : "center",
                  }));
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
              >
                <option value="center">อยู่กลาง</option>
                <option value="left">ชิดซ้าย</option>
                <option value="right">ชิดขวา</option>
              </select>

              <MiniRange
                label="X"
                value={img.posX}
                min={0}
                max={100}
                onInteraction={saveSelection}
                onChange={(v) => {
                  saveSelection();
                  setImg((s) => ({ ...s, posX: v }));
                }}
              />

              <MiniRange
                label="Y"
                value={img.posY}
                min={0}
                max={100}
                onInteraction={saveSelection}
                onChange={(v) => {
                  saveSelection();
                  setImg((s) => ({ ...s, posY: v }));
                }}
              />

              <MiniRange
                label="Zoom"
                value={Math.round(img.zoom * 100)}
                min={100}
                max={300}
                onInteraction={saveSelection}
                onChange={(v) => {
                  saveSelection();
                  setImg((s) => ({ ...s, zoom: v / 100 }));
                }}
              />

              <MiniRange
                label="มุม"
                value={img.radius}
                min={0}
                max={40}
                onInteraction={saveSelection}
                onChange={(v) => {
                  saveSelection();
                  setImg((s) => ({ ...s, radius: v }));
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertImage}
            className="mt-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700"
          >
            แทรก
          </button>

          <button
            type="button"
            onClick={resetImageState}
            className="mt-1 text-xs text-slate-400 hover:text-slate-600"
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
            onInput={() => {
              sync();
              saveSelection();
            }}
            onBlur={() => {
              sync();
              saveSelection();
            }}
            onKeyUp={() => {
              updateActiveFormats();
              saveSelection();
            }}
            onMouseUp={() => {
              updateActiveFormats();
              saveSelection();
            }}
            onFocus={() => {
              updateActiveFormats();
              saveSelection();
            }}
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
  onInteraction,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onInteraction?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-1 text-[10px] text-slate-500"
      onPointerDownCapture={onInteraction}
      onMouseDownCapture={onInteraction}
      onFocusCapture={onInteraction}
      onBlurCapture={onInteraction}
    >
      <span className="w-7 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          onInteraction?.();
          onChange(Number(e.target.value));
        }}
        className="h-3 min-w-0 flex-1 cursor-pointer accent-brand-500"
      />
    </div>
  );
}