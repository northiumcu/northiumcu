import type { Account } from "@/types/database";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CreditCard,
  FileText,
  Landmark,
  PiggyBank,
  Sparkles,
  Wallet,
} from "lucide-react";

export const accountTypeTheme: Record<
  Account["type"],
  { label: string; gradient: string; icon: LucideIcon; accent: string }
> = {
  checking: {
    label: "Checking",
    gradient: "from-sky-600 via-blue-600 to-indigo-600",
    icon: Wallet,
    accent: "text-sky-100",
  },
  savings: {
    label: "Savings",
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    icon: PiggyBank,
    accent: "text-emerald-100",
  },
  certificate: {
    label: "Certificate",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
    icon: Sparkles,
    accent: "text-violet-100",
  },
  youth: {
    label: "Youth Savings",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    icon: Sparkles,
    accent: "text-amber-50",
  },
  business: {
    label: "Business",
    gradient: "from-slate-700 via-northium-primary to-slate-800",
    icon: Landmark,
    accent: "text-slate-100",
  },
  retirement: {
    label: "Retirement",
    gradient: "from-indigo-700 via-blue-800 to-northium-primary",
    icon: Landmark,
    accent: "text-indigo-100",
  },
};

export const quickActions = [
  {
    href: "/member/transfers",
    label: "Transfer Funds",
    description: "Move money securely",
    gradient: "from-northium-primary to-sky-700",
    icon: ArrowLeftRight,
  },
  {
    href: "/member/cards",
    label: "Manage Cards",
    description: "Debit & credit controls",
    gradient: "from-violet-600 to-purple-700",
    icon: CreditCard,
  },
  {
    href: "/member/statements",
    label: "Statements",
    description: "Download activity",
    gradient: "from-emerald-600 to-teal-700",
    icon: FileText,
  },
] as const;
