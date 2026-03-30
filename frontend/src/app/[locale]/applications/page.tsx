"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/applications/StatusBadge";
import { getLocalizedField, formatDate } from "@/lib/utils";
import type { Application } from "@/types";
import { Plus, FileText } from "lucide-react";

export default function ApplicationsPage() {
  const t = useTranslations("applications");
  const locale = useLocale();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Application[]>("/applications")
      .then(({ data }) => setApplications(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <Link href="/applications/new">
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {t("newApplication")}
          </Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {t("noApplications")}
          </h2>
          <p className="text-gray-500 mb-6">{t("createFirst")}</p>
          <Link href="/applications/new">
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {t("newApplication")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {t("referenceNumber")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {t("permitType")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {t("status")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {t("createdAt")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/applications/${app.id}`}
                      className="text-emerald-600 hover:underline font-medium"
                    >
                      {app.reference_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {app.permit_type
                      ? getLocalizedField(app.permit_type, "name", locale)
                      : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(app.created_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
