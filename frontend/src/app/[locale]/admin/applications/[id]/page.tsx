"use client";

import { useEffect, useState, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/applications/StatusBadge";
import ChecklistProgressComponent from "@/components/documents/ChecklistProgress";
import { getLocalizedField, formatDate, formatFileSize } from "@/lib/utils";
import type {
  Application,
  ChecklistProgress,
  Document as DocType,
  ReviewRequest,
} from "@/types";
import { ArrowLeft } from "lucide-react";

export default function AdminReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("admin");
  const ta = useTranslations("applications");
  const td = useTranslations("documents");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [application, setApplication] = useState<Application | null>(null);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/applications/${id}`),
      api.get<DocType[]>(`/applications/${id}/documents`),
    ])
      .then(([appRes, docsRes]) => {
        setApplication(appRes.data);
        setProgress(appRes.data.checklist_progress || null);
        setDocuments(docsRes.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (action: ReviewRequest["action"]) => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/admin/applications/${id}/review`, {
        action,
        notes: reviewNotes,
      });
      setApplication(data);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !application) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        {tc("loading")}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin"
        className="text-sm text-emerald-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {tc("back")}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("review")}: {application.reference_number}
          </h1>
          <p className="text-gray-600">
            {application.permit_type
              ? getLocalizedField(application.permit_type, "name", locale)
              : ""}
            {" | "}
            {t("applicant")}:{" "}
            {application.user
              ? getLocalizedField(application.user, "full_name", locale)
              : "-"}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Application Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              {ta("applicationDetails")}
            </h2>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">{ta("propertyAddressEn")}</dt>
                <dd className="text-gray-900 mt-1">
                  {application.property_address_en || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{ta("propertyAddressAr")}</dt>
                <dd className="text-gray-900 mt-1" dir="rtl">
                  {application.property_address_ar || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{ta("plotNumber")}</dt>
                <dd className="text-gray-900 mt-1">
                  {application.plot_number || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{ta("district")}</dt>
                <dd className="text-gray-900 mt-1">
                  {application.district || "-"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Documents with extracted data */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              {ta("documents")}
            </h2>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {doc.original_filename}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {doc.file_type.toUpperCase()} &middot;{" "}
                      {formatFileSize(doc.file_size_bytes)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">
                    {td("documentType")}: {td(doc.processing_status)}
                  </p>

                  {doc.extracted_data && (
                    <details className="mt-2">
                      <summary className="text-sm text-emerald-700 cursor-pointer font-medium">
                        {td("extractedData")}
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-60">
                        {JSON.stringify(doc.extracted_data, null, 2)}
                      </pre>
                    </details>
                  )}

                  {doc.ai_validation_result && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-700 cursor-pointer font-medium">
                        {td("validationResult")}
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-60">
                        {JSON.stringify(doc.ai_validation_result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-gray-500 text-sm">No documents uploaded.</p>
              )}
            </div>
          </div>

          {/* Review Actions */}
          {(application.status === "submitted" ||
            application.status === "under_review") && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                {t("review")}
              </h2>
              <div className="mb-4">
                <label
                  htmlFor="review_notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("reviewNotes")}
                </label>
                <textarea
                  id="review_notes"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={t("reviewNotesPlaceholder")}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleReview("approve")}
                  disabled={submitting}
                >
                  {t("approve")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleReview("revision_requested")}
                  disabled={submitting}
                >
                  {t("requestRevision")}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleReview("reject")}
                  disabled={submitting}
                >
                  {t("reject")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>{progress && <ChecklistProgressComponent progress={progress} />}</div>
      </div>
    </div>
  );
}
