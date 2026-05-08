"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getParticipantTrials, getParticipants, toggleWordCorrect } from "@/lib/actions";
import { COLOR_HEX, COLOR_LABELS, type ExperimentColor } from "@/lib/stimuli";
import Link from "next/link";

type Trial = Awaited<ReturnType<typeof getParticipantTrials>>[number];

function ColorBadge({ color }: { color: string }) {
  return (
    <Badge
      style={{
        backgroundColor: COLOR_HEX[color as ExperimentColor],
        color: color === "yellow" ? "#000" : "#fff",
      }}
    >
      {COLOR_LABELS[color as ExperimentColor]}
    </Badge>
  );
}

export function ParticipantDetail({
  participantId,
}: {
  participantId: string;
}) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [participantInfo, setParticipantInfo] = useState<{ age: number | null; gender: string | null } | null>(null);
  const [sortKey, setSortKey] = useState<keyof Trial>("testOrder");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    getParticipantTrials(participantId).then(setTrials);
    getParticipants().then((all) => {
      const p = all.find((x) => x.id === participantId);
      if (p) setParticipantInfo({ age: p.age, gender: p.gender });
    });
  }, [participantId]);

  const handleToggle = async (trialId: string, currentValue: boolean) => {
    await toggleWordCorrect(trialId, !currentValue);
    setTrials((prev) =>
      prev.map((t) =>
        t.id === trialId ? { ...t, wordCorrect: !currentValue } : t
      )
    );
  };

  const handleSort = (key: keyof Trial) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = [...trials].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const colorCorrect = trials.filter((t) => t.colorCorrect).length;
  const wordCorrect = trials.filter((t) => t.wordCorrect).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Détail du participant
            </h1>
            <p className="text-sm text-muted-foreground">{participantId}</p>
            {participantInfo && (
              <p className="text-sm text-muted-foreground">
                Âge : {participantInfo.age ?? "—"} · Genre : {participantInfo.gender || "—"}
              </p>
            )}
          </div>
          <Link href="/admin">
            <Button variant="outline">Retour</Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{trials.length}/48</p>
              <p className="text-sm text-muted-foreground">Essais complétés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{wordCorrect}/48</p>
              <p className="text-sm text-muted-foreground">Mots corrects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{colorCorrect}/48</p>
              <p className="text-sm text-muted-foreground">
                Couleurs correctes
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Essais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      { key: "testOrder", label: "#" },
                      { key: "category", label: "Catégorie" },
                      { key: "word", label: "Mot correct" },
                      { key: "typedAnswer", label: "Réponse tapée" },
                      { key: "wordCorrect", label: "Mot OK" },
                      { key: "originalColor", label: "Couleur orig." },
                      { key: "selectedColor", label: "Couleur choisie" },
                      { key: "colorCorrect", label: "Couleur OK" },
                      { key: "confidence", label: "Confiance" },
                    ].map(({ key, label }) => (
                      <TableHead
                        key={key}
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort(key as keyof Trial)}
                      >
                        {label}
                        {sortKey === key && (sortAsc ? " ↑" : " ↓")}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.testOrder + 1}</TableCell>
                      <TableCell className="text-xs">{t.category}</TableCell>
                      <TableCell className="font-medium">{t.word}</TableCell>
                      <TableCell
                        className={
                          t.wordCorrect
                            ? "text-green-700"
                            : "text-red-600 font-medium"
                        }
                      >
                        {t.typedAnswer || "—"}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggle(t.id, t.wordCorrect)}
                          className="cursor-pointer"
                          title="Cliquez pour changer"
                        >
                          <Badge
                            variant={t.wordCorrect ? "default" : "secondary"}
                          >
                            {t.wordCorrect ? "Oui" : "Non"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <ColorBadge color={t.originalColor} />
                      </TableCell>
                      <TableCell>
                        <ColorBadge color={t.selectedColor} />
                      </TableCell>
                      <TableCell>
                        {t.colorCorrect ? (
                          <Badge variant="default">Oui</Badge>
                        ) : (
                          <Badge variant="secondary">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell>{t.confidence}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
