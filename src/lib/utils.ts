import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOrdinalSuffix(i: number): string {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return i + "st";
  if (j === 2 && k !== 12) return i + "nd";
  if (j === 3 && k !== 13) return i + "rd";
  return i + "th";
}

export function getSchoolCode(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("icademia_school_code") || "";
  }
  return "";
}

export function setSchoolCode(code: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("icademia_school_code", code);
  }
}

export function getCurrentAcademicSession(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 7 = Aug)
  
  // If we are before August, it's the previous year's session
  if (month < 7) {
    return `${year - 1}/${year}`;
  }
  // If we are in August or later, it's the new session
  return `${year}/${year + 1}`;
}

export function getAppOrigin(): string {
  // 1. Client-side browser window fallback
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // 2. Environment variable (ignore localhost unless explicitly in dev mode)
  if (process.env.APP_URL && (!process.env.APP_URL.includes("localhost") || process.env.NODE_ENV === "development")) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  // 3. Default production origin fallback
  return "https://icademia.app";
}
