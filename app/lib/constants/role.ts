export const ROLES  = {
    SUPERADMIN: "superadmin",
    ADMIN: "admin",
    EDITOR: "editor",
    CONTRIBUTOR: "contributor",
} as const;

export const ROLE_HIERARCHY: Record<string, number>={
    superadmin: 4,
    admin:3,
    editor:2,
    contributor:1,
}

export const ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];
export const CONTENT_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR, ROLES.CONTRIBUTOR];
export const EDITOR_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.EDITOR];