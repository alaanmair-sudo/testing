"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import api from "@/lib/api";
import StatusBadge from "@/components/applications/StatusBadge";
import { getLocalizedField, formatDate } from "@/lib/utils";
import type { Application, AdminStats, ApplicationStatus } from "@/types";
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const ta = useTranslations("applications");
  const locale = useLocale();

  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<AdminStats>("/admin/stats"),
      api.get<Application[]>("/admin/applications", {
        params: statusFilter ? { status: statusFilter } : {},
      }),
    ])
      .then(([statsRes, appsRes]) => {
        setStats(statsRes.data);
        setApplications(appsRes.data);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statCards = [
    {
      label: t("totalApplications"),
      value: stats.total,
      icon: FileText,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: t("pendingReview"),
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      label: t("approvedToday"),
      value: stats.approved,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: t("rejectedToday"),
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-600 bg-red-100",
    },
  ];

  const statuses: ApplicationStatus[] = [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "revision_requested",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("title")}</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("allApplications")}
        </h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">{t("allStatuses")}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Applications Table */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {ta("referenceNumber")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {t("applicant")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {ta("permitType")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {ta("status")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {ta("createdAt")}
                </th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">
                  {t("review")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {app.reference_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {app.user
                      ? getLocalizedField(app.user, "full_name", locale)
                      : "-"}
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
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="text-emerald-600 hover:underline text-sm font-medium"
                    >
                      {t("review")}
                    </Link>
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
