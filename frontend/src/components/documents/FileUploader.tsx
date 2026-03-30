"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import { Upload, File, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import type { Document } from "@/types";

interface FileUploaderProps {
  applicationId: string;
  checklistItemId: string;
  acceptedFormats: string[];
  onUploadComplete: (doc: Document) => void;
}

export default function FileUploader({
  applicationId,
  checklistItemId,
  acceptedFormats,
  onUploadComplete,
}: FileUploaderProps) {
  const t = useTranslations("documents");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("checklist_item_id", checklistItemId);

        const { data } = await api.post<Document>(
          `/applications/${applicationId}/documents`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        onUploadComplete(data);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [applicationId, checklistItemId, onUploadComplete]
  );

  const accept: Record<string, string[]> = {};
  if (acceptedFormats.includes("pdf")) {
    accept["application/pdf"] = [".pdf"];
  }
  if (acceptedFormats.includes("dwf")) {
    accept["application/x-dwf"] = [".dwf"];
    accept["model/vnd.dwf"] = [".dwf"];
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-300 hover:border-emerald-400"
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <p className="text-sm text-gray-600">{t("processing")}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">{t("dragDrop")}</p>
            <p className="text-xs text-gray-400">
              {t("acceptedFormats", { formats: acceptedFormats.join(", ").toUpperCase() })}
            </p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
