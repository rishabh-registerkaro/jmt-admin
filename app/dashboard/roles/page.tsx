"use client";

// Roles (RBAC) — Super Admin only (roles.manage).
// Built-in roles: Super Admin (locked), Admin, Editor, Leads Manager — their
// permissions can be edited but they can't be deleted. Custom roles can be
// created, edited and deleted once nobody holds them.

import { useCallback, useEffect, useState } from "react";
import { Lock, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PERMISSION_CATALOG, type PermissionGroup } from "@/app/lib/constants/permissions";
import { createRole, deleteRole, listRoles, updateRole, type AdminRoleDTO } from "@/lib/apiCallingRoles";

const GROUPS: PermissionGroup[] = ["Website content", "Leads", "Administration"];
const GRANTABLE = PERMISSION_CATALOG.filter((p) => p.grantable && !p.hidden);
const HIDDEN = new Set<string>(PERMISSION_CATALOG.filter((p) => p.hidden).map((p) => p.key));
const LABEL = Object.fromEntries(PERMISSION_CATALOG.map((p) => [p.key, p.label])) as Record<string, string>;

interface FormState {
  id: string | null; // null = creating
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

const EMPTY_FORM: FormState = { id: null, name: "", description: "", permissions: [], isSystem: false };

export default function RolesPage() {
  const [roles, setRoles] = useState<AdminRoleDTO[]>([]);
  const [seeded, setSeeded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<AdminRoleDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const res = await listRoles();
    if (res.success && res.roles) {
      setRoles(res.roles);
      setSeeded(res.seeded !== false);
    } else {
      toast.error(res.message || "Failed to load roles");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    listRoles().then((res) => {
      if (!alive) return;
      if (res.success && res.roles) {
        setRoles(res.roles);
        setSeeded(res.seeded !== false);
      } else {
        toast.error(res.message || "Failed to load roles");
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const openCreate = () => setForm({ ...EMPTY_FORM });
  const openEdit = (r: AdminRoleDTO) =>
    setForm({ id: r.id, name: r.name, description: r.description ?? "", permissions: [...r.permissions], isSystem: r.isSystem });

  const togglePermission = (key: string) =>
    setForm((f) =>
      f && {
        ...f,
        permissions: f.permissions.includes(key) ? f.permissions.filter((p) => p !== key) : [...f.permissions, key],
      },
    );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (form.name.trim().length < 2) return toast.error("Give the role a name (at least 2 characters).");
    if (form.permissions.length === 0) return toast.error("Pick at least one permission.");

    setSaving(true);
    const input = { name: form.name.trim(), description: form.description.trim(), permissions: form.permissions };
    const res = form.id ? await updateRole(form.id, input) : await createRole(input);
    setSaving(false);
    if (res.success) {
      toast.success(form.id ? "Role updated" : "Role created");
      setForm(null);
      load();
    } else {
      toast.error(res.message || "Failed to save role");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const res = await deleteRole(toDelete.id);
    setDeleting(false);
    if (res.success) {
      toast.success(`${toDelete.name} deleted`);
      setToDelete(null);
      load();
    } else {
      toast.error(res.message || "Failed to delete role");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-1">Roles</h1>
            <p className="text-sm text-muted-foreground">
              Decide what each kind of user can see and change. Assign roles on the Users page.
            </p>
          </div>
          <Button onClick={openCreate} disabled={!seeded} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New role
          </Button>
        </div>

        {!loading && !seeded && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            The built-in roles haven&apos;t been created yet. Run <code>npm run seed:roles</code> on the server
            (after <code>npx prisma db push</code>). Until then everyone keeps the access of their old role.
          </div>
        )}

        {/* Roles table */}
        <div className="rounded-lg border bg-card p-2 sm:p-4 overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground w-[24%]">Role</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Permissions</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-[80px] text-center">Users</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-[110px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell>
                      <div className="h-4 w-28 rounded bg-muted animate-pulse mb-2" />
                      <div className="h-3 w-40 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-72 rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-6 mx-auto rounded bg-muted animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-16 mx-auto rounded bg-muted animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : roles.length > 0 ? (
                roles.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="align-top whitespace-normal">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{r.name}</span>
                        {r.locked ? (
                          <Badge variant="default">
                            <Lock /> Full access
                          </Badge>
                        ) : r.isSystem ? (
                          <Badge variant="secondary">Built-in</Badge>
                        ) : null}
                      </div>
                      {r.description && <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>}
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      <div className="flex flex-wrap gap-1">
                        {r.permissions.filter((p) => !HIDDEN.has(p)).map((p) => (
                          <Badge key={p} variant="outline" className="font-normal">
                            {LABEL[p] ?? p}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-center text-sm tabular-nums">{r.userCount}</TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center justify-center gap-1">
                        {!r.locked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit role"
                            aria-label={`Edit ${r.name}`}
                            onClick={() => openEdit(r)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {!r.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={r.userCount > 0 ? "Move its users to another role first" : "Delete role"}
                            aria-label={`Delete ${r.name}`}
                            disabled={r.userCount > 0}
                            onClick={() => setToDelete(r)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No roles yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Only a Super Admin can manage roles, create Admins, or give someone a role that can manage users. Admins can
          only assign roles whose permissions they have themselves.
        </p>

        {/* Create / edit dialog */}
        <Dialog open={!!form} onOpenChange={(open) => !open && !saving && setForm(null)}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{form?.id ? `Edit ${form.name || "role"}` : "New role"}</DialogTitle>
              <DialogDescription>
                {form?.isSystem
                  ? "Built-in role: you can change its permissions, but not delete it."
                  : "Name the role and tick what it can do."}
              </DialogDescription>
            </DialogHeader>
            {form && (
              <form onSubmit={save} className="space-y-5 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="role-name">Name</Label>
                  <Input
                    id="role-name"
                    value={form.name}
                    maxLength={80}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Recruiter"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="role-description">Description</Label>
                  <Input
                    id="role-description"
                    value={form.description}
                    maxLength={255}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What this role is for (optional)"
                  />
                </div>

                {GROUPS.map((group) => {
                  const items = GRANTABLE.filter((p) => p.group === group);
                  if (items.length === 0) return null;
                  return (
                    <fieldset key={group} className="space-y-2">
                      <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {group}
                      </legend>
                      {items.map((p) => (
                        <label
                          key={p.key}
                          className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/40"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-input accent-brand"
                            checked={form.permissions.includes(p.key)}
                            onChange={() => togglePermission(p.key)}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">{p.label}</span>
                            <span className="block text-xs text-muted-foreground">{p.description}</span>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  );
                })}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setForm(null)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? "Saving…" : form.id ? "Save changes" : "Create role"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete {toDelete?.name}?</DialogTitle>
              <DialogDescription>This role will be removed. No users currently have it.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setToDelete(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete role"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
