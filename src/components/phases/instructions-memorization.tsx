"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InstructionsMemorization({
  onContinue,
}: {
  onContinue: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Instructions — Mémorisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              Vous allez voir <strong>48 mots</strong>, un par un, dans
              différentes couleurs. Chaque mot apparaîtra pendant{" "}
              <strong>4 secondes</strong>.
            </p>
            <p>
              Mémorisez à la fois le <strong>MOT</strong> et sa{" "}
              <strong>COULEUR</strong> — vous serez testé(e) plus tard sur les
              deux.
            </p>
            <p>
              Les mots seront présentés en <strong>deux passages</strong>. Après
              le premier passage de 48 mots, les mêmes mots seront présentés une
              seconde fois dans un ordre différent.
            </p>
            <p className="text-muted-foreground italic">
              Installez-vous confortablement et concentrez-vous bien.
            </p>
          </div>

          <Button onClick={onContinue} className="w-full" size="lg">
            Démarrer la mémorisation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
