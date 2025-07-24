import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 🇹🇷 Türkiye Saati Utility Class
export class TurkeyTime {
  // Backend UTC+3 veriyorsa ve istemci tarayıcı da UTC+3 çalışıyorsa 3 saat fazla görünüyor.
  // Saatleri 3 saat geri almak için -3 kullanıyoruz.
  static TIMEZONE_OFFSET = +3;

  static toTurkeyTime(utcDateString: string | Date): Date {
    const utcDate =
      typeof utcDateString === "string"
        ? new Date(utcDateString)
        : utcDateString;
    return new Date(utcDate.getTime() + this.TIMEZONE_OFFSET * 60 * 60 * 1000);
  }

  static format(
    utcDateString: string | Date,
    formatType: "date" | "time" | "datetime" | "relative" | "full" = "full"
  ): string {
    const turkeyDate = this.toTurkeyTime(utcDateString);

    const formatters = {
      date: () => turkeyDate.toLocaleDateString("tr-TR"),
      time: () =>
        turkeyDate.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      datetime: () =>
        turkeyDate.toLocaleString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      relative: () => this.getRelativeTime(utcDateString),
      full: () => turkeyDate.toLocaleString("tr-TR"),
    };

    return formatters[formatType]
      ? formatters[formatType]()
      : formatters.full();
  }

  static getRelativeTime(utcDateString: string | Date): string {
    const turkeyDate = new Date(
      this.toTurkeyTime(utcDateString).getTime() + 3 * 60 * 60 * 1000
    ); // 3 saat geri
    const turkeyNow = this.toTurkeyTime(new Date());

    const diffMs = turkeyNow.getTime() - turkeyDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Şimdi";
    if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;

    return this.format(utcDateString, "datetime");
  }
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "Bilinmiyor";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Geçersiz tarih";
  }

  if (isToday(dateObj)) {
    return format(dateObj, "HH:mm");
  }

  if (isYesterday(dateObj)) {
    return "Dün";
  }

  return format(dateObj, "dd/MM");
}

// 🇹🇷 Türkiye saati ile formatlanmış tarih
export function formatTurkeyDate(
  date: string | Date | null | undefined
): string {
  if (!date) return "Bilinmiyor";

  try {
    return TurkeyTime.format(date, "datetime");
  } catch (error) {
    return "Geçersiz tarih";
  }
}

// 🇹🇷 Göreceli zaman (Türkiye saati)
export function formatTurkeyRelativeTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "Bilinmiyor";

  try {
    return TurkeyTime.getRelativeTime(date);
  } catch (error) {
    return "Geçersiz tarih";
  }
}

export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "Bilinmiyor";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Geçersiz tarih";
  }

  return formatDistanceToNow(dateObj, {
    addSuffix: true,
  });
}

export function formatNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + "B";
  return (num / 1000000).toFixed(1) + "M";
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function truncateText(
  text: string | undefined | null,
  maxLength: number
): string {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  message?: string;
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Şifre en az 8 karakter olmalı");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Şifre en az bir büyük harf içermeli");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Şifre en az bir küçük harf içermeli");
  }

  if (!/\d/.test(password)) {
    errors.push("Şifre en az bir rakam içermeli");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Şifre en az bir özel karakter içermeli");
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors[0] : undefined,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
  }

  // Fallback for older browsers
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return Promise.resolve(true);
  } catch (err) {
    document.body.removeChild(textArea);
    return Promise.resolve(false);
  }
}

export function getFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function isValidImageFile(file: File): boolean {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  return validTypes.includes(file.type);
}

export function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;

      let newWidth = width;
      let newHeight = height;

      if (width > maxWidth) {
        newWidth = maxWidth;
        newHeight = (height * maxWidth) / width;
      }

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (newWidth * maxHeight) / newHeight;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx?.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          resolve(blob!);
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}
