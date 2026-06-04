"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Modifier,
} from "@dnd-kit/core";
import {
  restrictToFirstScrollableAncestor,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";

import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
import NewsContentRenderer from "@/components/news/NewsContentRenderer";
import CroppedImage from "@/components/ui/CroppedImage";
import {
  AddButton,
  DashboardPageHeader,
  FilterSelect,
  SearchFilter,
} from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/Form";
import { cn, formatDate } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  cropToJson,
  getDefaultImageCrop,
  type ImageCropSettings,
} from "@/lib/imageCrop";

const RichTextEditor = dynamic(
  () => import("@/components/dashboard/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50"
        style={{ minHeight: 420 }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    ),
  },
);

const FEATURED_LIMIT = 5;

type NewsRow = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  content_html: string | null;
  slug: string | null;
  category: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings:
    | Record<string, unknown>
    | string
    | ImageCropSettings
    | null;
  author_name: string | null;
  status: string | null;
  published_at: string | null;
  is_featured: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

type NewsForm = {
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  category: string;
  image_url: string;
  image_alt: string;
  image_crop_settings: ImageCropSettings;
  author_name: string;
  status: string;
  published_at: string;
  is_featured: boolean;
  sort_order: number;
};

const DEFAULT_COVER_CROP = getDefaultImageCrop({
  frameShape: "rounded",
  aspectPreset: "16:9",
});

const EMPTY_FORM: NewsForm = {
  title: "",
  slug: "",
  excerpt: "",
  content_html: "",
  category: "",
  image_url: "",
  image_alt: "",
  image_crop_settings: DEFAULT_COVER_CROP,
  author_name: "Admin",
  status: "draft",
  published_at: "",
  is_featured: false,
  sort_order: 0,
};

function createEmptyForm(): NewsForm {
  return {
    ...EMPTY_FORM,
    author_name: "Admin",
    published_at: getCurrentDateTimeLocal(),
    image_crop_settings: getDefaultImageCrop({
      frameShape: "rounded",
      aspectPreset: "16:9",
    }),
  };
}

function toSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0E00-\u0E7F-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "news"
  );
}
function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);

  return local.toISOString().slice(0, 16);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function contentTextToHtml(content: string | null): string {
  if (!content) return "";

  return content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function normalizeImageCropSettings(
  value: NewsRow["image_crop_settings"] | null | undefined,
): ImageCropSettings {
  if (!value) {
    return getDefaultImageCrop({ frameShape: "rounded", aspectPreset: "16:9" });
  }

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;

    if (!parsed || typeof parsed !== "object") {
      return getDefaultImageCrop({
        frameShape: "rounded",
        aspectPreset: "16:9",
      });
    }

    return cropToJson(parsed as Record<string, unknown>);
  } catch {
    return getDefaultImageCrop({ frameShape: "rounded", aspectPreset: "16:9" });
  }
}

function toForm(item: NewsRow): NewsForm {
  return {
    title: item.title || "",
    slug: item.slug || "",
    excerpt: item.excerpt || "",
    content_html: item.content_html || contentTextToHtml(item.content),
    category: item.category || "",
    image_url: item.image_url || "",
    image_alt: item.image_alt || "",
    image_crop_settings: normalizeImageCropSettings(item.image_crop_settings),
    author_name: "Admin",
    status: item.status || "draft",
    published_at: item.published_at ? item.published_at.slice(0, 16) : "",
    is_featured: item.is_featured ?? false,
    sort_order: item.sort_order ?? 0,
  };
}

function toPayload(form: NewsForm) {
  const now = new Date().toISOString();

  return {
    title: form.title,
    slug: form.slug || null,
    excerpt: form.excerpt || null,
    content_html: form.content_html || null,
    category: form.category || null,
    image_url: form.image_url || null,
    image_alt: form.image_alt || null,
    image_crop_settings: cropToJson(form.image_crop_settings),

    // บังคับผู้เขียนเป็น Admin เสมอ
    author_name: "Admin",

    status: form.status,

    // ถ้า publish แล้วไม่ได้เลือกเวลา ให้ใช้เวลาปัจจุบัน
    published_at: form.published_at
      ? new Date(form.published_at).toISOString()
      : form.status === "published"
        ? now
        : null,

    is_featured: form.is_featured,
    sort_order: form.sort_order,
  };
}

function getNewsTimestamp(item: NewsRow): number {
  const source = item.published_at || item.created_at || item.updated_at || "";
  const time = new Date(source).getTime();

  return Number.isFinite(time) ? time : 0;
}

function sortNewsNewestFirst(news: NewsRow[]): NewsRow[] {
  return [...news].sort((a, b) => getNewsTimestamp(b) - getNewsTimestamp(a));
}

function sortFeatured(news: NewsRow[]): NewsRow[] {
  return [...news].sort((a, b) => {
    const orderA = a.sort_order ?? 999;
    const orderB = b.sort_order ?? 999;

    if (orderA !== orderB) return orderA - orderB;
    return getNewsTimestamp(b) - getNewsTimestamp(a);
  });
}

function nextStatusLabel(status: string) {
  if (status === "published") return "เผยแพร่ข่าวเรียบร้อยแล้ว";
  if (status === "archived") return "ซ่อนข่าวเรียบร้อยแล้ว";
  return "บันทึกฉบับร่างเรียบร้อยแล้ว";
}

async function getAuthHeaders() {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function createRestrictToElementModifier(
  elementRef: React.RefObject<HTMLElement | null>,
): Modifier {
  return ({ transform, draggingNodeRect }) => {
    const element = elementRef.current;

    if (!element || !draggingNodeRect) {
      return transform;
    }

    const bounds = element.getBoundingClientRect();

    const minX = bounds.left - draggingNodeRect.left;
    const maxX = bounds.right - draggingNodeRect.right;
    const minY = bounds.top - draggingNodeRect.top;
    const maxY = bounds.bottom - draggingNodeRect.bottom;

    return {
      ...transform,
      x: Math.min(Math.max(transform.x, minX), maxX),
      y: Math.min(Math.max(transform.y, minY), maxY),
    };
  };
}

export default function NewsDashboard() {
  const [items, setItems] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsForm>(createEmptyForm);

  const [selectedSnapshot, setSelectedSnapshot] = useState<NewsRow | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

const boardRef = useRef<HTMLDivElement | null>(null);
const restrictToBoard = useMemo(
  () => createRestrictToElementModifier(boardRef),
  [],
);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
  );

  const activeDragItem = useMemo(() => {
    if (!activeDragId) return null;
    return items.find((item) => item.id === activeDragId) ?? null;
  }, [activeDragId, items]);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/news", { headers });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดข่าวได้");

      setItems(sortNewsNewestFirst(data.news ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข่าวได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((item) => {
      const text = [item.title, item.excerpt, item.category, item.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchQ = !query || text.includes(query);
      const matchS = status === "all" || (item.status || "draft") === status;

      return matchQ && matchS;
    });
  }, [items, q, status]);

  const featuredItems = useMemo(() => {
    return sortFeatured(filtered.filter((item) => item.is_featured));
  }, [filtered]);

  const normalItems = useMemo(() => {
    return sortNewsNewestFirst(filtered.filter((item) => !item.is_featured));
  }, [filtered]);

  const featuredCount = items.filter((item) => item.is_featured).length;

  const openAdd = () => {
    setEditingId(null);
    setSelectedSnapshot(null);
    setForm(createEmptyForm());
    setPreviewOpen(false);
    setNotice(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: NewsRow) => {
    setEditingId(item.id);
    setSelectedSnapshot(item);
    setForm(toForm(item));
    setPreviewOpen(false);
    setNotice(null);
    setError(null);
    setModalOpen(true);
  };

  const set = <K extends keyof NewsForm>(key: K, val: NewsForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("กรุณากรอกหัวข้อข่าว");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();
      const isEdit = !!editingId;

      const res = await fetch("/api/admin/news", {
        method: isEdit ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(
          isEdit ? { id: editingId, ...toPayload(form) } : toPayload(form),
        ),
      });

      const data = await res.json();

      if (!res.ok || !data.newsItem) {
        throw new Error(data.error || "ไม่สามารถบันทึกข่าวได้");
      }

      setItems((prev) =>
        sortNewsNewestFirst(
          isEdit
            ? prev.map((item) =>
                item.id === data.newsItem.id ? data.newsItem : item,
              )
            : [data.newsItem, ...prev],
        ),
      );

      setEditingId(data.newsItem.id);
      setSelectedSnapshot(data.newsItem);
      setForm(toForm(data.newsItem));
      setPreviewOpen(false);
      setModalOpen(false);
      setNotice(isEdit ? "บันทึกข่าวเรียบร้อยแล้ว" : "เพิ่มข่าวเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข่าวได้");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWithOverride = async (patch: Partial<NewsForm>) => {
    const nextForm = { ...form, ...patch, author_name: "Admin" };

    if (!nextForm.title.trim()) {
      setError("กรุณากรอกหัวข้อข่าว");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();
      const isEdit = !!editingId;
      const payload = toPayload(nextForm);

      const res = await fetch("/api/admin/news", {
        method: isEdit ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
      });

      const data = await res.json();

      if (!res.ok || !data.newsItem) {
        throw new Error(data.error || "ไม่สามารถบันทึกข่าวได้");
      }

      setItems((prev) =>
        sortNewsNewestFirst(
          isEdit
            ? prev.map((item) =>
                item.id === data.newsItem.id ? data.newsItem : item,
              )
            : [data.newsItem, ...prev],
        ),
      );

      setEditingId(data.newsItem.id);
      setSelectedSnapshot(data.newsItem);
      setForm(toForm(data.newsItem));
      setPreviewOpen(false);
      setModalOpen(false);
      setNotice(nextStatusLabel(data.newsItem.status));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข่าวได้");
    } finally {
      setSaving(false);
    }
  };

  const saveWithStatus = async (
    nextStatus: "draft" | "published" | "archived",
  ) => {
    set("status", nextStatus);
    await handleSaveWithOverride({ status: nextStatus });
  };

  const patchNewsItem = async (
    item: NewsRow,
    patch: Partial<NewsRow>,
    successMessage: string,
  ) => {
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();

      const res = await fetch("/api/admin/news", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          content_html: item.content_html,
          category: item.category,
          image_url: item.image_url,
          image_alt: item.image_alt,
          image_crop_settings: item.image_crop_settings,
          author_name: "Admin",
          status: item.status,
          published_at:
            item.published_at ||
            (item.status === "published" ? new Date().toISOString() : null),
          is_featured: item.is_featured,
          sort_order: item.sort_order,
          ...patch,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.newsItem) {
        throw new Error(data.error || "ไม่สามารถบันทึกข่าวได้");
      }

      setItems((prev) =>
        sortNewsNewestFirst(
          prev.map((news) =>
            news.id === data.newsItem.id ? data.newsItem : news,
          ),
        ),
      );

      setNotice(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข่าวได้");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToFeatured = async (item: NewsRow) => {
    if (item.is_featured) return;

    if (featuredCount >= FEATURED_LIMIT) {
      setError(`ข่าวเด่นกำหนดได้สูงสุด ${FEATURED_LIMIT} ข่าว`);
      return;
    }

    await patchNewsItem(
      item,
      {
        is_featured: true,
        sort_order: featuredCount + 1,
      },
      "ย้ายไปข่าวเด่นแล้ว",
    );
  };

  const handleMoveToNormal = async (item: NewsRow) => {
    if (!item.is_featured) return;

    await patchNewsItem(
      item,
      {
        is_featured: false,
        sort_order: 0,
      },
      "ย้ายกลับไปข่าวทั่วไปแล้ว",
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    setActiveDragId(null);

    if (!overId) return;

    const item = items.find((news) => news.id === activeId);
    if (!item) return;

    if (overId === "featured-zone" && !item.is_featured) {
      await handleMoveToFeatured(item);
      return;
    }

    if (overId === "normal-zone" && item.is_featured) {
      await handleMoveToNormal(item);
      return;
    }
  };

  const handleDragCancel = () => {
    setActiveDragId(null);
  };

  const handleToggleStatus = async (item: NewsRow) => {
    const nextStatus = item.status === "archived" ? "published" : "archived";

    await patchNewsItem(
      item,
      {
        status: nextStatus,
        published_at:
          nextStatus === "published"
            ? item.published_at || new Date().toISOString()
            : item.published_at,
      },
      nextStatus === "published"
        ? "เปิดแสดงข่าวเรียบร้อยแล้ว"
        : "ซ่อนข่าวเรียบร้อยแล้ว",
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();

      const res = await fetch(
        `/api/admin/news?id=${encodeURIComponent(deleteId)}&mode=delete`,
        {
          method: "DELETE",
          headers,
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถลบข่าวได้");
      }

      setItems((prev) => prev.filter((item) => item.id !== deleteId));
      setNotice("ลบข่าวเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถลบข่าวได้");
    } finally {
      setSaving(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardPageHeader
        title="ข่าว/ประกาศ"
        description={`ทั้งหมด ${items.length} รายการ · เผยแพร่ ${
          items.filter((i) => i.status === "published").length
        } รายการ · ข่าวเด่น ${featuredCount}/${FEATURED_LIMIT}`}
        action={<AddButton label="เพิ่มข่าว" onClick={openAdd} />}
      />

      {notice && <StatusBox type="success" message={notice} />}
      {error && <StatusBox type="error" message={error} />}

      <SearchFilter
        value={q}
        onChange={setQ}
        placeholder="ค้นหาจากหัวข้อ slug หรือหมวด..."
      >
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "ทุกสถานะ" },
            { value: "published", label: "เผยแพร่แล้ว" },
            { value: "draft", label: "ฉบับร่าง" },
            { value: "archived", label: "ซ่อนอยู่" },
          ]}
        />
      </SearchFilter>
<DndContext
  sensors={sensors}
  collisionDetection={closestCorners}
  modifiers={[restrictToBoard]}
  autoScroll={false}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
>
  <div
    ref={boardRef}
    className="relative mt-6 grid gap-6 overflow-hidden xl:grid-cols-2"
  >
<NewsDropColumn
  id="featured-zone"
  title={`ข่าวเด่น ${featuredItems.length}/${FEATURED_LIMIT}`}
  description="ลากข่าวเด่นกลับไปฝั่งข่าวทั่วไปได้"
  items={featuredItems}
  loading={loading}
  emptyLabel="ลากข่าวทั่วไปมาวางที่นี่เพื่อตั้งเป็นข่าวเด่น"
  onEdit={openEdit}
  onDelete={setDeleteId}
  onToggleStatus={handleToggleStatus}
  featured
  scrollable={false}
/>

<NewsDropColumn
  id="normal-zone"
  title={`ข่าวทั่วไป ${normalItems.length} รายการ`}
  description="ลากข่าวจากฝั่งนี้ไปวางที่ช่องข่าวเด่น"
  items={normalItems}
  loading={loading}
  emptyLabel="ยังไม่มีข่าวทั่วไป"
  onEdit={openEdit}
  onDelete={setDeleteId}
  onToggleStatus={handleToggleStatus}
  scrollable
/>
</div>

<DragOverlay modifiers={[restrictToBoard]} dropAnimation={null}>
  {activeDragItem ? (
    <div className="pointer-events-none w-[300px] rounded-2xl border border-brand-200 bg-white p-4 shadow-2xl sm:w-[360px]">
      <div className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900">
        {activeDragItem.title}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>{activeDragItem.category || "ไม่ระบุหมวดหมู่"}</span>
        {activeDragItem.is_featured && (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            ข่าวเด่น
          </span>
        )}
      </div>
    </div>
  ) : null}
</DragOverlay>
      </DndContext>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-2 sm:p-4 lg:p-6">
          <div className="mx-auto my-2 flex min-h-[calc(100vh-1rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:my-4 sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
                  <Newspaper className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900">
                    {editingId ? "แก้ไขข่าว" : "เพิ่มข่าว"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    พื้นที่กรอกข่าวแบบเต็มหน้าจอ พร้อม Preview แบบ Overlay
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                  ดู Preview
                </button>

                <button
                  type="button"
                  onClick={() => !saving && setModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/40 p-4 sm:p-6">
              {error && !saving && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    ข้อมูลหลักของข่าว
                  </h3>
                  <p className="text-xs text-slate-500">
                    หัวข้อ URL หมวดหมู่ สถานะ และวันที่เผยแพร่
                  </p>
                </div>

                <div className="space-y-5">
                  <FormInput
                    label="หัวข้อข่าว"
                    required
                    value={form.title}
                    onChange={(e) => {
                      set("title", e.target.value);
                      if (!editingId) set("slug", toSlug(e.target.value));
                    }}
                  />

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        Slug (URL)
                      </label>

                      <button
                        type="button"
                        onClick={() => set("slug", toSlug(form.title))}
                        className="text-xs text-brand-600 hover:text-brand-700"
                      >
                        สร้างจากหัวข้อ
                      </button>
                    </div>

                    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-300">
                      <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400">
                        /news/
                      </span>

                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) =>
                          set(
                            "slug",
                            e.target.value
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9\u0E00-\u0E7F-]/g, "")
                              .toLowerCase(),
                          )
                        }
                        placeholder="news-slug"
                        className="min-w-0 flex-1 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
                      />
                    </div>

                    {form.slug && (
                      <p className="mt-1 text-xs text-slate-400">
                        URL:{" "}
                        <span className="font-mono">/news/{form.slug}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FormInput
                      label="หมวดหมู่"
                      value={form.category}
                      placeholder="ประกาศ / กิจกรรม / ทุน ..."
                      onChange={(e) => set("category", e.target.value)}
                    />

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                      <div className="text-xs text-slate-400">ผู้เขียน</div>
                      <div className="font-medium text-slate-800">Admin</div>
                    </div>

                    <FormSelect
                      label="สถานะ"
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                      options={[
                        { value: "draft", label: "ฉบับร่าง" },
                        { value: "published", label: "เผยแพร่แล้ว" },
                        { value: "archived", label: "ซ่อน" },
                      ]}
                    />
<div>
  <FormInput
    label="ตั้งเวลาเผยแพร่ล่วงหน้า"
    type="datetime-local"
    value={form.published_at}
    onChange={(e) => set("published_at", e.target.value)}
  />
  <p className="mt-1 text-xs text-slate-400">
    ค่าเริ่มต้นคือเวลาปัจจุบัน สามารถแก้เป็นเวลาล่วงหน้าได้
  </p>
</div>
                  </div>

                  <label className="flex items-center gap-2.5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={(e) => set("is_featured", e.target.checked)}
                      className="h-4 w-4 rounded accent-brand-500"
                    />
                    ข่าวเด่น
                    <span className="text-xs text-slate-400">
                      ใช้ได้สูงสุด {FEATURED_LIMIT} ข่าว
                    </span>
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    เนื้อหาข่าว
                  </h3>
                  <p className="text-xs text-slate-500">
                    Editor ขยายเต็มความกว้าง ใช้จัดรูปภาพ ตาราง
                    และเนื้อหาได้สะดวกขึ้น
                  </p>
                </div>

                <RichTextEditor
                  value={form.content_html}
                  onChange={(html) => set("content_html", html)}
                  placeholder="เขียนเนื้อหาข่าวที่นี่... รองรับ หัวข้อ ตัวหนา ตัวเอียง รายการ link รูปภาพ และตาราง"
                  minHeight={520}
                />
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    คำโปรยและรูปปกข่าว
                  </h3>
                  <p className="text-xs text-slate-500">
                    จัดการ SEO สั้น ๆ และอัปโหลดรูปปกพร้อม Crop
                  </p>
                </div>

                <div className="space-y-5">
                  <FormTextarea
                    label="คำโปรย (สำหรับแสดงในรายการและ SEO)"
                    rows={3}
                    value={form.excerpt}
                    placeholder="สรุปย่อของข่าว แสดงในหน้ารายการ 1-2 ประโยค"
                    onChange={(e) => set("excerpt", e.target.value)}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      รูปปกข่าว
                    </label>

                    <CloudinaryImageUploader
                      value={form.image_url}
                      onChange={(url) => set("image_url", url)}
                      folder="news"
                      label="อัปโหลดรูปปก"
                    />

                    {form.image_url && (
                      <div className="mt-4 space-y-4">
                        <input
                          type="text"
                          value={form.image_alt}
                          onChange={(e) => set("image_alt", e.target.value)}
                          placeholder="คำอธิบายรูป (Alt text)"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
                        />

                        <ImageCropControls
                          imageUrl={form.image_url}
                          alt={form.image_alt || form.title || "news cover"}
                          value={form.image_crop_settings}
                          onChange={(crop) => set("image_crop_settings", crop)}
                          frameShape="rounded"
                          aspectPreset="16:9"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => saveWithStatus("draft")}
                  disabled={saving}
                >
                  Save Draft
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    saveWithStatus(
                      form.status === "published" ? "draft" : "published",
                    )
                  }
                  disabled={saving}
                >
                  {form.status === "published" ? "Unpublish" : "Publish"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  ยกเลิก
                </Button>

                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </div>

            {previewOpen && (
              <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/70 p-2 sm:p-6">
                <div className="mx-auto my-2 w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl sm:my-4">
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Preview ข่าว
                      </h3>
                      <p className="text-xs text-slate-500">
                        แสดงผลจากข้อมูลที่กำลังกรอกอยู่
                        ยังไม่จำเป็นต้องบันทึกก่อนดู
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewOpen(false)}
                      className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <article className="bg-white">
                    {form.image_url && (
                      <CroppedImage
                        src={form.image_url}
                        alt={form.image_alt || form.title || "news cover"}
                        crop={form.image_crop_settings}
                        className="aspect-[16/7] w-full rounded-none"
                      />
                    )}

                    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {form.category && (
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                            {form.category}
                          </span>
                        )}

                        <span>
                          {form.status === "published"
                            ? "เผยแพร่แล้ว"
                            : form.status === "archived"
                              ? "ซ่อน"
                              : "ฉบับร่าง"}
                        </span>

                        {form.published_at && (
                          <span>· {formatDate(form.published_at)}</span>
                        )}

                        <span>· Admin</span>
                      </div>

                      <h1 className="text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
                        {form.title || "หัวข้อข่าว"}
                      </h1>

                      {form.excerpt && (
                        <p className="mt-4 text-lg leading-8 text-slate-600">
                          {form.excerpt}
                        </p>
                      )}

                      <div className="mt-8">
                        <NewsContentRenderer html={form.content_html} />
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="ลบข่าวนี้ถาวร?"
        description="ข่าวนี้จะถูกลบออกจากฐานข้อมูลจริง และไม่สามารถกู้คืนจากหน้านี้ได้"
        variant="danger"
        confirmLabel="ลบถาวร"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function NewsDropColumn({
  id,
  title,
  description,
  items,
  loading,
  emptyLabel,
  onEdit,
  onDelete,
  onToggleStatus,
  featured = false,
  scrollable = true,
}: {
  id: string;
  title: string;
  description: string;
  items: NewsRow[];
  loading: boolean;
  emptyLabel: string;
  onEdit: (item: NewsRow) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (item: NewsRow) => void;
  featured?: boolean;
  scrollable?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-3xl border bg-white p-4 shadow-sm transition sm:p-5",
        scrollable
          ? "h-[620px] min-h-[620px] md:h-[720px] md:min-h-[720px] xl:h-[780px] xl:min-h-[780px]"
          : "h-auto min-h-[260px]",
        isOver
          ? "border-brand-300 bg-brand-50/50 ring-2 ring-brand-200"
          : "border-slate-200",
      )}
    >
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        {featured && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            Featured
          </span>
        )}
      </div>

      <div
        className={cn(
          scrollable
            ? "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
            : "overflow-visible",
        )}
      >
        <div className="space-y-3 pb-3">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
              กำลังโหลดข่าว...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
              {emptyLabel}
            </div>
          ) : (
            items.map((item) => (
              <DraggableNewsCard
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DraggableNewsCard({
  item,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  item: NewsRow;
  onEdit: (item: NewsRow) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (item: NewsRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
    });



  return (
<article
  ref={setNodeRef}
  className={cn(
    "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition",
    isDragging && "opacity-30",
  )}
>
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="mt-0.5 cursor-grab touch-none rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-400 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 active:cursor-grabbing"
          title="ลากเพื่อย้ายข่าว"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {item.is_featured && (
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            )}

            <NewsStatus status={item.status || "draft"} />
          </div>

          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-900">
            {item.title}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{item.category || "ไม่ระบุหมวดหมู่"}</span>

            {item.published_at && (
              <>
                <span>·</span>
                <span>{formatDate(item.published_at)}</span>
              </>
            )}
          </div>

          {item.slug && (
            <a
              href={`/news/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-slate-400 transition hover:text-brand-600"
            >
              /news/{item.slug}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleStatus(item)}
            className={
              item.status === "archived"
                ? "rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                : "rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-100 hover:text-emerald-700"
            }
            title={
              item.status === "archived"
                ? "กดเพื่อเปิดแสดงข่าว"
                : "กดเพื่อซ่อนข่าว"
            }
          >
            {item.status === "archived" ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-600"
            title="แก้ไข"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            title="ลบถาวร"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusBox({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const ok = type === "success";

  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      <span>{message}</span>
    </div>
  );
}

function NewsStatus({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        status === "published"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : status === "archived"
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {status === "published"
        ? "เผยแพร่แล้ว"
        : status === "archived"
          ? "ซ่อนอยู่"
          : "ฉบับร่าง"}
    </span>
  );
}