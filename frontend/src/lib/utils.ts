/* eslint-disable @typescript-eslint/no-explicit-any */
export function getLocalizedField(
  item: any,
  field: string,
  locale: string
): string {
  const key = `${field}_${locale}`;
  const fallback = `${field}_${locale === "ar" ? "en" : "ar"}`;
  return item[key] || item[fallback] || "";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(
    locale === "ar" ? "ar-JO" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    revision_requested: "bg-orange-100 text-orange-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
