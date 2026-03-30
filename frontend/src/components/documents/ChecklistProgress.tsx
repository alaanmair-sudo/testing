"use client";

import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getLocalizedField } from "@/lib/utils";
import type { ChecklistProgress as ChecklistProgressType } from "@/types";

export default function ChecklistProgress({
  progress,
}: {
  progress: ChecklistProgressType;
}) {
  const t = useTranslations("documents");
  const locale = useLocale();

  const percentage =
    progress.total_required > 0
      ? Math.round((progress.satisfied / progress.total_required) * 100)
      : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">
        {t("checklistProgress")}
      </h3>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">
            {progress.satisfied} / {progress.total_required}
          </span>
          <span className="text-gray-600">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-emerald-600 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {progress.items.map((item) => (
          <li key={item.checklist_item.id} className="flex items-center gap-2">
            {item.status === "satisfied" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : item.status === "processing" ? (
              <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-400 shrink-0" />
            )}
            <span
              className={`text-sm ${
                item.status === "satisfied"
                  ? "text-emerald-700"
                  : item.status === "processing"
                  ? "text-yellow-700"
                  : "text-gray-500"
              }`}
            >
              {getLocalizedField(item.checklist_item, "name", locale)}
            </span>
            {item.checklist_item.is_required && item.status === "missing" && (
              <span className="text-xs text-red-500">({t("required")})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
