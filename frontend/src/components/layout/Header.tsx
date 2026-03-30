"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitcher from "./LanguageSwitcher";
import { Building2, LogOut, LayoutDashboard, FileText } from "lucide-react";

export default function Header() {
  const t = useTranslations();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {t("common.appName")}
              </h1>
              <p className="text-xs text-gray-500">{t("common.appSubtitle")}</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === "admin" || user.role === "staff" ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t("common.dashboard")}
                  </Link>
                ) : null}
                <Link
                  href="/applications"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  {t("applications.title")}
                </Link>
                <span className="text-sm text-gray-500 px-2">
                  {user.full_name_en || user.email}
                </span>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {t("common.login")}
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  {t("common.register")}
                </Link>
              </>
            )}
            <LanguageSwitcher />
          </nav>
        </div>
      </div>
    </header>
  );
}
