import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Building2, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre espace de travail
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                Informations du bureau
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nom</label>
                <input
                  type="text"
                  defaultValue="Kilowater"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">SIRET</label>
                <input
                  type="text"
                  placeholder="XXX XXX XXX XXXXX"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  defaultValue="contact@kilowater.fr"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Téléphone</label>
                <input
                  type="tel"
                  placeholder="04 XX XX XX XX"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="col-span-full space-y-1">
                <label className="text-sm font-medium">Adresse</label>
                <input
                  type="text"
                  placeholder="Adresse du bureau"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <Button size="sm">Sauvegarder</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Sécurité</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Mot de passe actuel
              </label>
              <input
                type="password"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Confirmation</label>
              <input
                type="password"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button size="sm">Modifier le mot de passe</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                Configuration des agents IA
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Configurez les clés API et les paramètres globaux de vos agents
              d&apos;intelligence artificielle.
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium">Clé API OpenAI</label>
              <input
                type="password"
                placeholder="sk-..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Fréquence de prospection
              </label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option>Toutes les heures</option>
                <option>Toutes les 4 heures</option>
                <option>Quotidien</option>
                <option>Hebdomadaire</option>
              </select>
            </div>
            <Button size="sm">Sauvegarder</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
