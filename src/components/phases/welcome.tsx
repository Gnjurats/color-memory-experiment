"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WelcomePhase({ onStart }: { onStart: (pseudo: string | null) => void }) {
  const [pseudo, setPseudo] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onStart(pseudo.trim() || null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Expérience de Mémoire des Couleurs
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Étude sur la mémoire visuelle
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cette étude porte sur la mémoire visuelle. Vous allez voir une série
            de mots à mémoriser, puis vous serez testé(e) sur ce que vous avez
            retenu. La durée totale est d&apos;environ 15 minutes. Toutes vos
            réponses sont anonymes.
          </p>

          <div className="space-y-2">
            <Label htmlFor="pseudo">Pseudo / Prénom (optionnel)</Label>
            <Input
              id="pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Entrez votre pseudo..."
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
              J&apos;accepte de participer à cette étude. Je comprends que mes
              réponses seront enregistrées de manière anonyme et que je peux
              arrêter à tout moment.
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!consent || loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Chargement..." : "Commencer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
