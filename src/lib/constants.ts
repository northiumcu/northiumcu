export const publicNav = [
  { label: "About", href: "/about" },
  { label: "Membership", href: "/membership" },
  { label: "Accounts", href: "/accounts" },
  { label: "Loans", href: "/loans" },
  { label: "Cards", href: "/cards" },
  { label: "Security", href: "/security" },
  { label: "Contact", href: "/contact" },
] as const;

export const memberNav = [
  { label: "Dashboard", href: "/member", icon: "layout-dashboard" },
  { label: "Accounts", href: "/member/accounts", icon: "wallet" },
  { label: "Transfers", href: "/member/transfers", icon: "arrow-left-right" },
  { label: "Cards", href: "/member/cards", icon: "credit-card" },
  { label: "Statements", href: "/member/statements", icon: "file-text" },
  { label: "Loans", href: "/member/loans", icon: "landmark" },
  { label: "Profile", href: "/member/profile", icon: "user" },
  { label: "Security", href: "/member/security", icon: "shield" },
] as const;

export const adminNav = [
  { label: "Dashboard", href: "/hard", icon: "layout-dashboard" },
  { label: "Members", href: "/hard/members", icon: "users" },
  { label: "Accounts", href: "/hard/accounts", icon: "wallet" },
  { label: "Loans", href: "/hard/loans", icon: "landmark" },
  { label: "Cards", href: "/hard/cards", icon: "credit-card" },
  { label: "Reports", href: "/hard/reports", icon: "bar-chart-3" },
  { label: "Settings", href: "/hard/settings", icon: "settings" },
  { label: "Security", href: "/hard/security", icon: "shield" },
] as const;
