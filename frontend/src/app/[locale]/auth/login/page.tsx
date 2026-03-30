"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { login } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Building2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/applications");
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">{t("loginTitle")}</h1>
          <p className="text-gray-600 mt-1">{t("loginSubtitle")}</p>
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
            id="email"
            type="email"
            label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            dir="ltr"
          />

          <Input
            id="password"
            type="password"
            label={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            dir="ltr"
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : t("loginTitle")}
          </Button>

          <p className="text-center text-sm text-gray-600">
            {t("noAccount")}{" "}
            <Link
              href="/auth/register"
              className="text-emerald-600 hover:underline font-medium"
            >
              {t("registerHere")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
