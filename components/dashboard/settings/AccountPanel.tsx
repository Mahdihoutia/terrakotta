"use client";

import { useState } from "react";
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
import { Loader2, KeyRound, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

type RoleValue = "ADMIN" | "COLLABORATEUR" | "LECTURE_SEULE";

interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: RoleValue;
}

const ROLE_LABEL: Record<RoleValue, { label: string; tone: string }> = {
  ADMIN: { label: "Administrateur", tone: "bg-blue-50 text-blue-700 border-blue-200" },
  COLLABORATEUR: { label: "Collaborateur", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  LECTURE_SEULE: { label: "Lecture seule", tone: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export default function AccountPanel({ currentUser }: { currentUser: CurrentUser }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const role = ROLE_LABEL[currentUser.role];

  async function handleChangePassword() {
    if (!currentPassword) {
      toast.error("Mot de passe actuel requis.");
      return;
    }
    if (password.length < 8) {
      toast.error("Nouveau mot de passe : 8 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password === currentPassword) {
      toast.error("Le nouveau mot de passe doit différer de l'actuel.");
      return;
    }
    if (currentUser.id === "admin-env") {
      toast.error("Compte env-based", {
        description:
          "Ce compte est défini via les variables d'environnement. Modifiez ADMIN_PASSWORD_HASH côté Vercel ou créez un compte en DB.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, currentPassword }),
      });
      if (!res.ok) {
        await showApiError(res, "Changement de mot de passe impossible");
        return;
      }
      toast.success("Mot de passe mis à jour. Reconnectez-vous.", {
        description:
          "Toutes les sessions actives ont été invalidées pour des raisons de sécurité.",
      });
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      // Révoque la session actuelle — les autres devices repassent par /auth/login
      await signOut({ callbackUrl: "/auth/login" });
    } catch (err) {
      showNetworkError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-4 w-4 text-primary" />
            Mon compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Nom</span>
            <span className="font-medium">{currentUser.name || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{currentUser.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Rôle</span>
            <Badge variant="outline" className={cn("text-[11px]", role.tone)}>
              {role.label}
            </Badge>
          </div>
          <p className="pt-2 text-xs text-muted-foreground">
            Pour modifier votre nom ou votre email, demandez à un administrateur.
            <br />
            TODO — préférences (notifications email, langue) à venir.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" />
            Mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Pour confirmer votre identité"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Minimum 8 caractères"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirmation</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={submitting || !currentPassword || password.length < 8}
            size="sm"
          >
            {submitting && (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            )}
            Changer mon mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
