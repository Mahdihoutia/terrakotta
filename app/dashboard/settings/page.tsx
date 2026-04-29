import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ShieldAlert, UserCog } from "lucide-react";
import { getSession } from "@/lib/auth-helpers";
import { Role } from "@prisma/client";
import UsersPanel from "@/components/dashboard/settings/UsersPanel";
import AccountPanel from "@/components/dashboard/settings/AccountPanel";

export default async function SettingsPage() {
  const session = await getSession();
  const currentUser = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        role: session.user.role,
      }
    : null;
  const isAdmin = currentUser?.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez votre compte, les utilisateurs et les informations du bureau.
        </p>
      </div>

      <Tabs defaultValue="compte">
        <TabsList>
          <TabsTrigger value="compte">Compte</TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="bureau">Bureau</TabsTrigger>
        </TabsList>

        <TabsContent value="compte" className="mt-4">
          {currentUser ? (
            <AccountPanel currentUser={currentUser} />
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Session introuvable.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="utilisateurs" className="mt-4">
          {isAdmin && currentUser ? (
            <UsersPanel currentUserId={currentUser.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Accès réservé aux administrateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Seul un compte avec le rôle ADMIN peut gérer les utilisateurs.
                  Demandez à un administrateur de modifier votre rôle si
                  nécessaire.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bureau" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Informations du bureau
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />À venir — raison sociale, SIRET,
                qualifications RGE, logo et coordonnées utilisés dans les
                exports PDF (devis, factures, audits).
              </p>
              <p>
                Ces informations seront stockées dans une table dédiée
                (`organisation`) et chargées en en-tête de tous les documents
                générés.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
