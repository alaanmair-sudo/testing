"use client";

import { useEffect, useState, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/applications/StatusBadge";
import ChecklistProgressComponent from "@/components/documents/ChecklistProgress";
import { getLocalizedField, formatDate } from "@/lib/utils";
import type { Application, ChecklistProgress, Document as DocType } from "@/types";
import { ArrowLeft, Upload } from "lucide-react";

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("applications");
  const td = useTranslations("documents");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [application, setApplication] = useState<Application | null>(null);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Application & { checklist_progress: ChecklistProgress }>(
        `/applications/${id}`
      ),
      api.get<DocType[]>(`/applications/${id}/documents`),
    ])
      .then(([appRes, docsRes]) => {
        setApplication(appRes.data);
        setProgress(appRes.data.checklist_progress || null);
        setDocuments(docsRes.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!confirm(t("submitConfirm"))) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/applications/${id}/submit`);
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
        href="/applications"
        className="text-sm text-emerald-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {tc("back")}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {application.reference_number}
          </h1>
          <p className="text-gray-600">
            {application.permit_type
              ? getLocalizedField(application.permit_type, "name", locale)
              : ""}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              {t("applicationDetails")}
            </h2>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">{t("propertyAddressEn")}</dt>
                <dd className="text-gray-900 mt-1">
                  {application.property_address_en || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("propertyAddressAr")}</dt>
                <dd className="text-gray-900 mt-1" dir="rtl">
                  {application.property_address_ar || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("plotNumber")}</dt>
                <dd className="text-gray-900 mt-1">
                  {application.plot_number || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("district")}</dt>
                <dd className="text-gray-900 mt-1">
                  {application.district || "-"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">{t("projectDescriptionEn")}</dt>
                <dd className="text-gray-900 mt-1">
                  {application.project_description_en || "-"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">{t("projectDescriptionAr")}</dt>
                <dd className="text-gray-900 mt-1" dir="rtl">
                  {application.project_description_ar || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{t("createdAt")}</dt>
                <dd className="text-gray-900 mt-1">
                  {formatDate(application.created_at, locale)}
                </dd>
              </div>
              {application.submitted_at && (
                <div>
                  <dt className="text-gray-500">{t("submittedAt")}</dt>
                  <dd className="text-gray-900 mt-1">
                    {formatDate(application.submitted_at, locale)}
                  </dd>
                </div>
              )}
            </dl>

            {application.review_notes && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  Review Notes:
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {application.review_notes}
                </p>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t("documents")}</h2>
              {application.status === "draft" && (
                <Link href={`/applications/${id}/documents`}>
                  <Button size="sm">
                    <Upload className="h-4 w-4 me-2" />
                    {t("uploadDocuments")}
                  </Button>
                </Link>
              )}
            </div>

            {documents.length === 0 ? (
              <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.file_type.toUpperCase()} &middot;{" "}
                        {td(doc.processing_status)}
                      </p>
                    </div>
                    {doc.processing_status === "completed" &&
                      doc.ai_validation_result && (
                        <span className="text-xs text-emerald-600 font-medium">
                          {td("completed")}
                        </span>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          {application.status === "draft" && (
            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={submitting} size="lg">
                {submitting ? "..." : t("submitApplication")}
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar - Checklist Progress */}
        <div>
          {progress && <ChecklistProgressComponent progress={progress} />}
        </div>
      </div>
    </div>
  );
}
