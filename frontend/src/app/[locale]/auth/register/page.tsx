"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { register, login } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Building2 } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name_en: "",
    full_name_ar: "",
    phone: "",
    national_id: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name_en: formData.full_name_en,
        full_name_ar: formData.full_name_ar,
        phone: formData.phone || undefined,
        national_id: formData.national_id || undefined,
      });
      await login(formData.email, formData.password);
      router.push("/applications");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            {t("registerTitle")}
          </h1>
          <p className="text-gray-600 mt-1">{t("registerSubtitle")}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <Input
            id="full_name_en"
            label={t("fullNameEn")}
            value={formData.full_name_en}
            onChange={(e) => updateField("full_name_en", e.target.value)}
            required
            dir="ltr"
          />

          <Input
            id="full_name_ar"
            label={t("fullNameAr")}
            value={formData.full_name_ar}
            onChange={(e) => updateField("full_name_ar", e.target.value)}
            required
            dir="rtl"
          />

          <Input
            id="email"
            type="email"
            label={t("email")}
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
            dir="ltr"
          />

          <Input
            id="phone"
            type="tel"
            label={t("phone")}
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            dir="ltr"
          />

          <Input
            id="national_id"
            label={t("nationalId")}
            value={formData.national_id}
            onChange={(e) => updateField("national_id", e.target.value)}
            dir="ltr"
          />

          <Input
            id="password"
            type="password"
            label={t("password")}
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
            dir="ltr"
          />

          <Input
            id="confirmPassword"
            type="password"
            label={t("confirmPassword")}
            value={formData.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            required
            dir="ltr"
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t("registerTitle")}
          </Button>

          <p className="text-center text-sm text-gray-600">
            {t("hasAccount")}{" "}
            <Link
              href="/auth/login"
              className="text-emerald-600 hover:underline font-medium"
            >
              {t("signInHere")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
