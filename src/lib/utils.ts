export const cn = (...classes: (string | undefined | false | null)[]) =>
  classes.filter(Boolean).join(" ");

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const generateRefNo = () => {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `CMP-${y}-${rand}`;
};

// localStorage helpers
const COMPLAINTS_KEY = "mock_complaints";

export const getStoredComplaints = <T,>(): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPLAINTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addStoredComplaint = <T,>(item: T) => {
  if (typeof window === "undefined") return;
  const list = getStoredComplaints<T>();
  list.unshift(item);
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(list));
};

export const setStoredComplaints = <T,>(list: T[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(list));
};
