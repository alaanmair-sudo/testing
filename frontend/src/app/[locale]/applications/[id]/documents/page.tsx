"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import api from "@/lib/api";
import FileUploader from "@/components/documents/FileUploader";
import { getLocalizedField } from "@/lib/utils";
import type { ChecklistItem, Document as DocType } from "@/types";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function DocumentsUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("documents");
  const ta = useTranslations("applications");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [appRes, docsRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get<DocType[]>(`/applications/${id}/documents`),
      ]);
      const permitTypeCode = appRes.data.permit_type?.code;
      if (permitTypeCode) {
        const checklistRes = await api.get<ChecklistItem[]>(
          `/checklists/${permitTypeCode}`
        );
        setChecklistItems(checklistRes.data);
      }
      setDocuments(docsRes.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadComplete = (doc: DocType) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const getDocumentForItem = (itemId: string) => {
    return documents.find((d) => d.checklist_item_id === itemId);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        {tc("loading")}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/applications/${id}`}
        className="text-sm text-emerald-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {tc("back")}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {ta("uploadDocuments")}
      </h1>
      <p className="text-gray-600 mb-8">{ta("checklist")}</p>

      <div className="space-y-6">
        {checklistItems.map((item) => {
          const existingDoc = getDocumentForItem(item.id);
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {existingDoc ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400 shrink-0" />
                    )}
                    {getLocalizedField(item, "name", locale)}
                  </h3>
                  {item.description_en && (
                    <p className="text-sm text-gray-500 mt-1 ms-7">
                      {getLocalizedField(item, "description", locale)}
                    </p>
                  )}
                </div>
                {item.is_required && (
                  <span className="text-xs text-red-500 font-medium">
                    {t("required")}
                  </span>
                )}
              </div>

              {existingDoc ? (
                <div className="ms-7 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm font-medium text-emerald-800">
                    {existingDoc.original_filename}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {t(existingDoc.processing_status)}
                  </p>
                  {existingDoc.extracted_data && (
                    <details className="mt-2">
                      <summary className="text-xs text-emerald-700 cursor-pointer">
                        {t("extractedData")}
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(existingDoc.extracted_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <div className="ms-7">
                  <FileUploader
                    applicationId={id}
                    checklistItemId={item.id}
                    acceptedFormats={item.accepted_formats}
                    onUploadComplete={handleUploadComplete}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
