"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import api from "@/lib/api";
import { getLocalizedField } from "@/lib/utils";
import type { PermitType, ChecklistItem } from "@/types";
import { CheckCircle2 } from "lucide-react";

export default function ChecklistsPage() {
  const t = useTranslations("applications");
  const locale = useLocale();
  const [permitTypes, setPermitTypes] = useState<PermitType[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PermitType[]>("/permit-types")
      .then(async ({ data: pts }) => {
        setPermitTypes(pts);
        const results: Record<string, ChecklistItem[]> = {};
        await Promise.all(
          pts.map(async (pt) => {
            const { data } = await api.get<ChecklistItem[]>(
              `/checklists/${pt.code}`
            );
            results[pt.code] = data;
          })
        );
        setChecklists(results);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("checklist")}</h1>

      <div className="space-y-8">
        {permitTypes.map((pt) => (
          <div
            key={pt.id}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {getLocalizedField(pt, "name", locale)}
            </h2>
            <ul className="space-y-3">
              {(checklists[pt.code] || []).map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getLocalizedField(item, "name", locale)}
                    </p>
                    {item.description_en && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {getLocalizedField(item, "description", locale)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Formats: {item.accepted_formats.join(", ").toUpperCase()}
                      {item.is_required ? " • Required" : " • Optional"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
