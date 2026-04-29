"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Copy,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

type RoleValue = "ADMIN" | "COLLABORATEUR" | "LECTURE_SEULE";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: RoleValue;
  createdAt: string;
}

interface Props {
  currentUserId: string;
}

const ROLE_DESCRIPTIONS: Record<RoleValue, { label: string; tone: string; description: string }> = {
  ADMIN: {
    label: "Administrateur",
    tone: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Accès complet, gestion des utilisateurs, suppressions.",
  },
  COLLABORATEUR: {
    label: "Collaborateur",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Création et modification, pas de gestion des comptes.",
  },
  LECTURE_SEULE: {
    label: "Lecture seule",
    tone: "bg-zinc-100 text-zinc-700 border-zinc-200",
    description: "Consultation uniquement, aucune modification.",
  },
};

const ROLES: RoleValue[] = ["ADMIN", "COLLABORATEUR", "LECTURE_SEULE"];

function generatePassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!?@#";
  const arr = new Uint32Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 1e9);
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[arr[i] % alphabet.length];
  }
  return out;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function UsersPanel({ currentUserId }: Props) {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingMigration, setPendingMigration] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.status === 503) {
        const json = await res.json().catch(() => null);
        setPendingMigration(
          json?.message ??
            "Migration users.deleted_at requise.",
        );
        setUsers([]);
        return;
      }
      if (!res.ok) {
        await showApiError(res, "Impossible de charger les utilisateurs");
        return;
      }
      const list = (await res.json()) as UserRow[];
      setPendingMigration(null);
      setUsers(list);
    } catch (err) {
      showNetworkError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (pendingMigration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Migration en attente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{pendingMigration}</p>
          <p>
            Exécute le fichier{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              prisma/migrations/_manual/2026_04_28_add_user_deleted_at.sql
            </code>{" "}
            dans Supabase puis relance{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              npx prisma generate
            </code>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Utilisateurs</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comptes ayant accès au tableau de bord. Les comptes supprimés
              sont déplacés dans la corbeille.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Inviter un utilisateur
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !users || users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucun utilisateur en base. Créez le premier compte ADMIN via le
              script bootstrap{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                npx tsx prisma/seeds/admin.ts &lt;email&gt; &lt;password&gt;
              </code>
              .
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Nom</th>
                    <th className="px-3 py-2 text-left font-medium">Email</th>
                    <th className="px-3 py-2 text-left font-medium">Rôle</th>
                    <th className="px-3 py-2 text-left font-medium">Créé le</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => {
                    const isSelf = u.id === currentUserId;
                    const role = ROLE_DESCRIPTIONS[u.role];
                    return (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {u.name || "—"}
                            </span>
                            {isSelf && (
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                Vous
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="outline"
                            className={cn("text-[11px]", role.tone)}
                          >
                            {role.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditing(u)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isSelf}
                              onClick={() => setDeleting(u)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchUsers}
      />
      {editing && (
        <EditUserDialog
          user={editing}
          isSelf={editing.id === currentUserId}
          onClose={() => setEditing(null)}
          onUpdated={fetchUsers}
        />
      )}
      {deleting && (
        <DeleteUserDialog
          user={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={fetchUsers}
        />
      )}
    </div>
  );
}

/* ─────────── Create dialog ─────────── */

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleValue>("COLLABORATEUR");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setEmail("");
    setName("");
    setPassword("");
    setRole("COLLABORATEUR");
  }

  async function handleSubmit() {
    if (!email.trim() || password.length < 8) {
      toast.error("Email requis et mot de passe ≥ 8 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          password,
          role,
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Création impossible");
        return;
      }
      // Copie le mot de passe dans le presse-papiers.
      try {
        await navigator.clipboard.writeText(password);
        toast.success("Utilisateur créé", {
          description:
            "Le mot de passe a été copié dans le presse-papiers. Transmettez-le par un canal sécurisé.",
        });
      } catch {
        toast.success("Utilisateur créé", {
          description: `Mot de passe : ${password}`,
        });
      }
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err) {
      showNetworkError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
          <DialogDescription>
            Crée un compte avec un mot de passe initial. L&apos;utilisateur
            pourra le modifier depuis l&apos;onglet « Compte ».
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@exemple.fr"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Nom</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optionnel"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-password">Mot de passe</Label>
            <div className="flex gap-2">
              <Input
                id="user-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                autoComplete="new-password"
                className="font-mono text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPassword(generatePassword())}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Générer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!password}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(password);
                    toast.success("Copié");
                  } catch {
                    toast.error("Copie impossible");
                  }
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Le mot de passe sera copié dans le presse-papiers à la création.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <div className="grid gap-2">
              {ROLES.map((r) => {
                const meta = ROLE_DESCRIPTIONS[r];
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "rounded-md border bg-background p-3 text-left transition-colors",
                      "hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{meta.label}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", meta.tone)}
                      >
                        {r}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            )}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Edit dialog ─────────── */

function EditUserDialog({
  user,
  isSelf,
  onClose,
  onUpdated,
}: {
  user: UserRow;
  isSelf: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [role, setRole] = useState<RoleValue>(user.role);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (password.length > 0 && password.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim() || null,
      };
      if (!isSelf) body.role = role;
      if (password.length >= 8) body.password = password;

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        await showApiError(res, "Mise à jour impossible");
        return;
      }
      toast.success("Utilisateur mis à jour");
      onClose();
      onUpdated();
    } catch (err) {
      showNetworkError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier {user.name || user.email}</DialogTitle>
          <DialogDescription>
            {user.email} · créé le{" "}
            {formatDate(user.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nom</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Rôle {isSelf && <span className="text-xs text-muted-foreground">(non modifiable pour soi-même)</span>}</Label>
            <div className="grid gap-2">
              {ROLES.map((r) => {
                const meta = ROLE_DESCRIPTIONS[r];
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={isSelf}
                    onClick={() => setRole(r)}
                    className={cn(
                      "rounded-md border bg-background p-3 text-left transition-colors",
                      "hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active && "border-primary ring-1 ring-primary",
                      isSelf && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{meta.label}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", meta.tone)}
                      >
                        {r}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-password">Réinitialiser le mot de passe</Label>
            <div className="flex gap-2">
              <Input
                id="edit-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Laisser vide pour ne pas changer"
                autoComplete="new-password"
                className="font-mono text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPassword(generatePassword())}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Générer
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Delete dialog ─────────── */

function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: UserRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      toast.success("Utilisateur déplacé dans la corbeille");
      onClose();
      onDeleted();
    } catch (err) {
      showNetworkError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer cet utilisateur ?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {user.name || user.email}
            </span>{" "}
            sera déplacé dans la corbeille. Vous pourrez le restaurer depuis la
            page Corbeille.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            disabled={submitting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {submitting && (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            )}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
