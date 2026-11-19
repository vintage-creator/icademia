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

export function getAdminToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("icademia_admin_token") || "";
  }
  return "";
}

export function setSchoolCode(code: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("icademia_school_code", code);
  }
}

export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

const ADMIN_SESSION_EXPIRES_KEY = "icademia_admin_session_expires_at";
const TEACHER_SESSION_EXPIRES_KEY = "teacher_session_expires_at";

type SessionRole = "admin" | "teacher";

function getSessionExpiryKey(role: SessionRole) {
  return role === "admin" ? ADMIN_SESSION_EXPIRES_KEY : TEACHER_SESSION_EXPIRES_KEY;
}

export function touchLocalSession(role: SessionRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getSessionExpiryKey(role),
    String(Date.now() + SESSION_IDLE_TIMEOUT_MS),
  );
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("icademia_admin_token");
  localStorage.removeItem("icademia_admin_session_expires_at");
  if (!localStorage.getItem("teacher_token")) {
    localStorage.removeItem("icademia_school_code");
  }
}

export function clearTeacherSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("teacher_token");
  localStorage.removeItem("teacher_profile");
  localStorage.removeItem("teacher_session_expires_at");
}

export function hasValidLocalSession(role: SessionRole) {
  if (typeof window === "undefined") return false;

  const tokenKey = role === "admin" ? "icademia_admin_token" : "teacher_token";
  const token = localStorage.getItem(tokenKey);
  if (!token) return false;

  const expiresAt = Number(localStorage.getItem(getSessionExpiryKey(role)) || 0);
  if (!expiresAt || Date.now() >= expiresAt) {
    if (role === "admin") {
      clearAdminSession();
    } else {
      clearTeacherSession();
    }
    return false;
  }

  return true;
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
