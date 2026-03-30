import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Building2, FileSearch, Clock, ArrowRight, ArrowLeft } from "lucide-react";

export default function HomePage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <Building2 className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {t("heroTitle")}
            </h1>
            <h2 className="text-xl sm:text-2xl font-medium mb-6 text-emerald-200">
              {t("heroSubtitle")}
            </h2>
            <p className="text-lg text-emerald-100 mb-10">
              {t("heroDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-semibold rounded-lg px-8 py-3 hover:bg-emerald-50 transition-colors"
              >
                {t("getStarted")}
                <ArrowRight className="h-5 w-5 rtl:hidden" />
                <ArrowLeft className="h-5 w-5 ltr:hidden" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-semibold rounded-lg px-8 py-3 hover:bg-white/10 transition-colors"
              >
                {tc("login")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("feature1Title")}
              </h3>
              <p className="text-gray-600">{t("feature1Desc")}</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileSearch className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("feature2Title")}
              </h3>
              <p className="text-gray-600">{t("feature2Desc")}</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-emerald-100 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("feature3Title")}
              </h3>
              <p className="text-gray-600">{t("feature3Desc")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
