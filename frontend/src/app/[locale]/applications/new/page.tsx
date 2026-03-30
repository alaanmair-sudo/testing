"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getLocalizedField } from "@/lib/utils";
import type { PermitType, ApplicationCreate } from "@/types";
import { Building2, HardHat, Hammer, ArrowRight, ArrowLeft } from "lucide-react";

const permitIcons: Record<string, React.ReactNode> = {
  construction: <Building2 className="h-8 w-8" />,
  renovation: <HardHat className="h-8 w-8" />,
  demolition: <Hammer className="h-8 w-8" />,
};

export default function NewApplicationPage() {
  const t = useTranslations("applications");
  const tp = useTranslations("permits");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [permitTypes, setPermitTypes] = useState<PermitType[]>([]);
  const [selectedType, setSelectedType] = useState<PermitType | null>(null);
  const [step, setStep] = useState<"select" | "form">("select");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ApplicationCreate>({
    permit_type_id: "",
    property_address_en: "",
    property_address_ar: "",
    plot_number: "",
    district: "",
    project_description_en: "",
    project_description_ar: "",
  });

  useEffect(() => {
    api
      .get<PermitType[]>("/permit-types")
      .then(({ data }) => setPermitTypes(data));
  }, []);

  const updateField = (field: keyof ApplicationCreate, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectType = (pt: PermitType) => {
    setSelectedType(pt);
    setFormData((prev) => ({ ...prev, permit_type_id: pt.id }));
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/applications", formData);
      router.push(`/applications/${data.id}`);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  if (step === "select") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("selectPermitType")}
        </h1>
        <p className="text-gray-600 mb-8">{t("selectPermitTypeDesc")}</p>

        <div className="grid md:grid-cols-3 gap-4">
          {permitTypes.map((pt) => (
            <button
              key={pt.id}
              onClick={() => handleSelectType(pt)}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 text-start hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="text-emerald-600 mb-3 group-hover:text-emerald-700">
                {permitIcons[pt.code] || <Building2 className="h-8 w-8" />}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {getLocalizedField(pt, "name", locale)}
              </h3>
              <p className="text-sm text-gray-500">
                {getLocalizedField(pt, "description", locale)}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => setStep("select")}
        className="text-sm text-emerald-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {tc("back")}
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {t("applicationDetails")}
      </h1>
      <p className="text-gray-600 mb-6">
        {selectedType
          ? getLocalizedField(selectedType, "name", locale)
          : ""}
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <Input
          id="property_address_en"
          label={t("propertyAddressEn")}
          value={formData.property_address_en}
          onChange={(e) => updateField("property_address_en", e.target.value)}
          required
          dir="ltr"
        />

        <Input
          id="property_address_ar"
          label={t("propertyAddressAr")}
          value={formData.property_address_ar}
          onChange={(e) => updateField("property_address_ar", e.target.value)}
          dir="rtl"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="plot_number"
            label={t("plotNumber")}
            value={formData.plot_number}
            onChange={(e) => updateField("plot_number", e.target.value)}
            required
            dir="ltr"
          />
          <Input
            id="district"
            label={t("district")}
            value={formData.district}
            onChange={(e) => updateField("district", e.target.value)}
            required
          />
        </div>

        <div>
          <label
            htmlFor="project_description_en"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("projectDescriptionEn")}
          </label>
          <textarea
            id="project_description_en"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={formData.project_description_en}
            onChange={(e) =>
              updateField("project_description_en", e.target.value)
            }
            required
            dir="ltr"
          />
        </div>

        <div>
          <label
            htmlFor="project_description_ar"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("projectDescriptionAr")}
          </label>
          <textarea
            id="project_description_ar"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={formData.project_description_ar}
            onChange={(e) =>
              updateField("project_description_ar", e.target.value)
            }
            dir="rtl"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "..." : tc("save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/applications")}
          >
            {tc("cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
