// Shared role badge colour + label for the Users, Profile and Roles screens.

const LEGACY_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  contributor: "Editor", // contributor is merged into Editor
};

/** Display name: the role's name when known, else the legacy enum label. */
export function roleLabel(user: { roleName?: string | null; role?: string | null } | null | undefined): string {
  if (!user) return "N/A";
  return user.roleName || LEGACY_LABELS[user.role ?? ""] || "N/A";
}

/** Badge classes by role key (or legacy enum value). Custom roles get a neutral badge. */
export function roleBadgeClass(key: string | null | undefined): string {
  switch (key) {
    case "superadmin":
      return "bg-brand/10 text-brand-link border-brand/30";
    case "admin":
      return "bg-secondary text-foreground border-border-strong";
    case "editor":
    case "contributor":
      return "bg-brand/10 text-brand-link border-brand/30";
    case "leads":
      return "bg-warning/10 text-warning border-warning/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
