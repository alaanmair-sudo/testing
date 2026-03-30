"use client";

import { useTranslations } from "next-intl";
import Badge from "@/components/ui/Badge";
import { getStatusColor } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useTranslations("status");
  return <Badge className={getStatusColor(status)}>{t(status)}</Badge>;
}
