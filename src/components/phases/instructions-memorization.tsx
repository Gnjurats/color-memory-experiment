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
              Vous allez voir une série de mots, un par un, dans différentes
              couleurs. Chaque mot apparaîtra pendant{" "}
              <strong>4 secondes</strong>.
            </p>
            <p>
              Mémorisez à la fois le <strong>MOT</strong> et sa{" "}
              <strong>COULEUR</strong> — vous serez testé(e) plus tard sur les
              deux.
            </p>
            <p>
              La liste vous sera présentée <strong>deux fois de suite</strong>{" "}
              pour faciliter la mémorisation.
            </p>
            <p className="text-muted-foreground italic">
              Installez-vous confortablement et concentrez-vous.
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
