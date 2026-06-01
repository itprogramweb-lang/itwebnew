"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export type PublicLanguage = "th" | "en";

export const PUBLIC_LANGUAGE_STORAGE_KEY = "public-language";
export const PUBLIC_LANGUAGE_CHANGE_EVENT = "public-language-change";

const GOOGLE_TRANSLATE_ELEMENT_ID = "google_translate_element";
const GOOGLE_TRANSLATE_SCRIPT_ID = "google-translate-script";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
          },
          element: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export function isPublicTranslateExcludedPath(pathname: string | null) {
  if (!pathname) return true;
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/login" ||
    pathname === "/api" ||
    pathname.startsWith("/api/")
  );
}

function isPublicLanguage(value: string | null): value is PublicLanguage {
  return value === "th" || value === "en";
}

function getSavedLanguage(): PublicLanguage {
  if (typeof window === "undefined") return "th";
  const saved = window.localStorage.getItem(PUBLIC_LANGUAGE_STORAGE_KEY);
  return isPublicLanguage(saved) ? saved : "th";
}

function setDocumentLanguage(language: PublicLanguage) {
  document.documentElement.lang = language;
}

function setGoogleTranslateCookie(value: string | null) {
  const maxAge = value ? 60 * 60 * 24 * 365 : 0;
  const cookieValue = value ?? "";
  const baseCookie = `googtrans=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = baseCookie;

  const hostname = window.location.hostname;
  if (hostname && hostname !== "localhost" && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    document.cookie = `${baseCookie}; domain=${hostname}`;
    document.cookie = `${baseCookie}; domain=.${hostname}`;
  }
}

function getTranslateSelect() {
  return document.querySelector<HTMLSelectElement>("select.goog-te-combo");
}

function triggerTranslateSelect(language: PublicLanguage) {
  const select = getTranslateSelect();
  if (!select) return false;

  select.value = language === "en" ? "en" : "";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function loadGoogleTranslateScript() {
  if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export function requestPublicLanguageChange(language: PublicLanguage) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ language: PublicLanguage }>(PUBLIC_LANGUAGE_CHANGE_EVENT, {
      detail: { language },
    })
  );
}

export default function PublicAutoTranslateProvider() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const retryTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
    };
  }, []);

  useEffect(() => {
    if (isPublicTranslateExcludedPath(pathname)) {
      setDocumentLanguage("th");
      return;
    }

    const applyLanguage = (language: PublicLanguage, attempt = 0) => {
      window.localStorage.setItem(PUBLIC_LANGUAGE_STORAGE_KEY, language);
      setDocumentLanguage(language);

      if (language === "th") {
        const shouldReload =
          Boolean(getTranslateSelect()) ||
          document.documentElement.classList.contains("translated-ltr") ||
          document.body.classList.contains("translated-ltr");
        setGoogleTranslateCookie(null);
        if (shouldReload) window.location.reload();
        return;
      }

      setGoogleTranslateCookie("/th/en");
      loadGoogleTranslateScript();

      if (triggerTranslateSelect("en")) return;
      if (attempt >= 20) return;

      retryTimer.current = window.setTimeout(() => {
        applyLanguage("en", attempt + 1);
      }, 250);
    };

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement || initialized.current) return;
      initialized.current = true;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "th",
          includedLanguages: "th,en",
          autoDisplay: false,
        },
        GOOGLE_TRANSLATE_ELEMENT_ID
      );
      if (getSavedLanguage() === "en") applyLanguage("en");
    };

    const savedLanguage = getSavedLanguage();
    setDocumentLanguage(savedLanguage);
    if (savedLanguage === "en") {
      loadGoogleTranslateScript();
      applyLanguage("en");
    }

    const onLanguageChange = (event: Event) => {
      const language = (event as CustomEvent<{ language?: PublicLanguage }>).detail?.language;
      if (!language) return;
      applyLanguage(language);
    };

    window.addEventListener(PUBLIC_LANGUAGE_CHANGE_EVENT, onLanguageChange);
    return () => {
      window.removeEventListener(PUBLIC_LANGUAGE_CHANGE_EVENT, onLanguageChange);
    };
  }, [pathname]);

  if (isPublicTranslateExcludedPath(pathname)) return null;

  return (
    <div
      id={GOOGLE_TRANSLATE_ELEMENT_ID}
      aria-hidden="true"
      className="public-google-translate-element"
    />
  );
}
