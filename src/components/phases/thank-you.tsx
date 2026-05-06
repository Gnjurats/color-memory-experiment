"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl">
            Merci pour votre participation !
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Vos réponses ont été enregistrées avec succès. Vous pouvez maintenant
            fermer cette page.
          </p>
          <div className="text-6xl">🧠</div>
        </CardContent>
      </Card>
    </div>
  );
}
