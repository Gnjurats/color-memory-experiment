"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TestInstructions({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Instructions — Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              Pour chaque mot que vous avez vu, on va vous montrer sa{" "}
              <strong>première lettre</strong> et sa <strong>catégorie</strong>.
            </p>
            <p>
              Vous aurez <strong>4,5 secondes</strong> pour écrire le mot
              complet.
            </p>
            <p>
              Ensuite, sans limite de temps, vous indiquerez la{" "}
              <strong>couleur</strong> du mot et votre{" "}
              <strong>niveau de confiance</strong> (1 = pas du tout sûr, 4 =
              totalement sûr).
            </p>
            <p className="text-muted-foreground italic">
              Les mots sont regroupés par catégorie. Prenez votre temps pour les
              étapes de couleur et confiance.
            </p>
          </div>

          <Button onClick={onContinue} className="w-full" size="lg">
            Commencer le test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
