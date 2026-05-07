"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLOR_LABELS, COLORS } from "@/lib/stimuli";

type TutorialStep = "show-word" | "recall" | "color" | "confidence";

const PINK = "#E91E63";

export function TestTutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<TutorialStep>("show-word");
  const [showButton, setShowButton] = useState(false);

  // Auto-show the continue button after 3s on the first step
  useEffect(() => {
    if (step !== "show-word") return;
    const id = setTimeout(() => setShowButton(true), 3000);
    return () => clearTimeout(id);
  }, [step]);

  if (step === "show-word") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
          Exemple
        </p>
        <p className="text-base text-gray-500 mb-6">
          Voici un exemple de mot que vous pourriez voir :
        </p>
        <p className="text-2xl font-medium text-[#666] uppercase tracking-wide mb-4 select-none">
          Animaux
        </p>
        <p
          className="text-6xl font-bold select-none mb-10"
          style={{ color: PINK }}
        >
          Éléphant
        </p>
        {showButton && (
          <Button onClick={() => setStep("recall")} size="lg">
            Continuer
          </Button>
        )}
      </div>
    );
  }

  if (step === "recall") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
          Exemple — Étape 1
        </p>
        <p className="text-sm text-gray-500 mb-2 font-medium">
          Catégorie : Animaux
        </p>
        <p className="text-5xl font-bold text-[#888] select-none mb-6">É</p>
        <Input
          value="Éléphant"
          readOnly
          className="text-center text-lg max-w-md mb-4"
        />
        <p className="text-sm text-gray-500 max-w-md text-center mb-8">
          Lorsque vous verrez la première lettre du mot et sa catégorie, vous
          aurez <strong>4,5 secondes</strong> pour taper le mot complet.
        </p>
        <Button onClick={() => setStep("color")} size="lg">
          Continuer
        </Button>
      </div>
    );
  }

  if (step === "color") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
          Exemple — Étape 2
        </p>
        <p className="text-4xl font-bold text-gray-400 mb-4">Éléphant</p>
        <p className="text-sm text-gray-500 mb-6">
          Ensuite, vous indiquerez la couleur dans laquelle le mot était
          affiché.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {COLORS.map((color) => (
            <div
              key={color}
              className="w-28 h-14 rounded-xl border-2 border-gray-200 bg-[#E5E5E5] text-[#333] font-bold text-base flex items-center justify-center"
            >
              {COLOR_LABELS[color]}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 max-w-sm text-center mb-8">
          Dans cet exemple, le mot était rose — mais dans le vrai test, le mot
          sera toujours en rouge, jaune, bleu ou vert.
        </p>
        <Button onClick={() => setStep("confidence")} size="lg">
          Continuer
        </Button>
      </div>
    );
  }

  // confidence step
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
        Exemple — Étape 3
      </p>
      <p className="text-4xl font-bold text-gray-400 mb-4">Éléphant</p>
      <p className="text-sm text-gray-500 mb-6">
        Enfin, vous indiquerez votre niveau de confiance dans votre choix de
        couleur.
      </p>
      <div className="flex gap-3 mb-2">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-16 h-16 text-xl font-bold rounded-md border border-gray-200 flex items-center justify-center text-gray-600"
          >
            {level}
          </div>
        ))}
      </div>
      <div className="flex justify-between w-72 text-xs text-gray-400 mb-4">
        <span>Extrêmement incertain</span>
        <span>Extrêmement certain</span>
      </div>
      <p className="text-xs text-gray-400 max-w-sm text-center mb-8">
        1 = pas du tout sûr, 4 = totalement sûr.
      </p>
      <Button onClick={onComplete} size="lg">
        Démarrer le vrai test
      </Button>
    </div>
  );
}
