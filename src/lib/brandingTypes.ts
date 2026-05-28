// Shared types and defaults — ไม่มี server imports, client component ใช้ได้

export type BrandingData = {
  brandName: string;
  brandShortName: string;
  departmentNameTh: string;
  departmentNameEn: string;
  universityNameTh: string;
  universityNameEn: string;

  logoUrl: string | null;
  logoAlt: string;
  logoDesktopSize: number;
  logoMobileSize: number;
  logoCropPreset: string;
  logoObjectPosition: string;
  logoFitMode: string;
  logoPosX: number;
  logoPosY: number;
  logoZoom: number;

  logoNavbarDisplayMode: "contained" | "free";
  logoNavbarVisualSizeDesktop: number;
  logoNavbarVisualSizeMobile: number;
  logoNavbarOffsetX: number;
  logoNavbarOffsetY: number;
  logoNavbarZIndex: number;
  logoNavbarOverflow: "visible" | "contained";

  showLogo: boolean;
  showBrandName: boolean;

  loanExternalUrl: string;
  welfareExternalUrl: string;

  phone: string | null;
  email: string | null;
  address: string | null;
  facebookUrl: string | null;
  lineUrl: string | null;
};

export const DEFAULT_BRANDING: BrandingData = {
  brandName: "Computer Technology",
  brandShortName: "CT",

  departmentNameTh: "สาขาวิชาเทคโนโลยีคอมพิวเตอร์",
  departmentNameEn: "Computer Technology",

  universityNameTh: "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี",
  universityNameEn: "Rajamangala University of Technology Thanyaburi",

  logoUrl: null,
  logoAlt: "โลโก้สาขา",
  logoDesktopSize: 44,
  logoMobileSize: 40,
  logoCropPreset: "square-contain",
  logoObjectPosition: "center",
  logoFitMode: "contain",
  logoPosX: 50,
  logoPosY: 50,
  logoZoom: 1,

  logoNavbarDisplayMode: "contained",
  logoNavbarVisualSizeDesktop: 96,
  logoNavbarVisualSizeMobile: 72,
  logoNavbarOffsetX: 0,
  logoNavbarOffsetY: 0,
  logoNavbarZIndex: 45,
  logoNavbarOverflow: "visible",

  showLogo: true,
  showBrandName: true,

  loanExternalUrl: "https://sd.rmutt.ac.th/?page_id=2274",
  welfareExternalUrl: "https://sd.rmutt.ac.th/",

  phone: null,
  email: null,
  address: null,
  facebookUrl: null,
  lineUrl: null,
};