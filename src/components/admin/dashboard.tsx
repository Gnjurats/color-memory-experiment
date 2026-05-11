"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { getParticipants, getAggregateStats, getCompleteParticipantIds } from "@/lib/actions";
import { logout } from "@/lib/auth";
import { StatsChart } from "./stats-chart";
import { ExportButtons } from "./export-buttons";
import Link from "next/link";

type Participant = Awaited<ReturnType<typeof getParticipants>>[number];
type Stats = Awaited<ReturnType<typeof getAggregateStats>>;
type Tab = "participants" | "complete" | "young" | "stats";

function ParticipantsTable({ participants, emptyMessage }: { participants: Participant[]; emptyMessage: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pseudo</TableHead>
          <TableHead>Âge</TableHead>
          <TableHead>Genre</TableHead>
          <TableHead>Début</TableHead>
          <TableHead>Fin</TableHead>
          <TableHead>Progression</TableHead>
          <TableHead>Détails</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.pseudo || "—"}</TableCell>
            <TableCell className="text-sm">{p.age ?? "—"}</TableCell>
            <TableCell className="text-sm">{p.gender || "—"}</TableCell>
            <TableCell className="text-sm">
              {new Date(p.startedAt).toLocaleString("fr-FR")}
            </TableCell>
            <TableCell className="text-sm">
              {p.completedAt
                ? new Date(p.completedAt).toLocaleString("fr-FR")
                : "—"}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  p.trialCount >= 48 ? "default" : "secondary"
                }
              >
                {p.trialCount} / 48
              </Badge>
            </TableCell>
            <TableCell>
              <Link href={`/admin/participant/${p.id}`}>
                <Button variant="outline" size="sm">
                  Voir
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
        {participants.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [completeIds, setCompleteIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Stats>([]);
  const [tab, setTab] = useState<Tab>("participants");
  const router = useRouter();

  useEffect(() => {
    getParticipants().then(setParticipants);
    getCompleteParticipantIds().then(setCompleteIds);
    getAggregateStats().then(setStats);
  }, []);

  const completeParticipants = participants.filter((p) => completeIds.has(p.id));
  const youngCompleteParticipants = completeParticipants.filter(
    (p) => p.age != null && p.age <= 30
  );

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Administration
          </h1>
          <div className="flex gap-2">
            <ExportButtons />
            <Button variant="outline" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={tab === "participants" ? "default" : "outline"}
            onClick={() => setTab("participants")}
          >
            Participants ({participants.length})
          </Button>
          <Button
            variant={tab === "complete" ? "default" : "outline"}
            onClick={() => setTab("complete")}
          >
            Participants complets ({completeParticipants.length})
          </Button>
          <Button
            variant={tab === "young" ? "default" : "outline"}
            onClick={() => setTab("young")}
          >
            ≤ 30 ans (complets) ({youngCompleteParticipants.length})
          </Button>
          <Button
            variant={tab === "stats" ? "default" : "outline"}
            onClick={() => setTab("stats")}
          >
            Statistiques
          </Button>
        </div>

        <Separator />

        {tab === "participants" && (
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipantsTable
                participants={participants}
                emptyMessage="Aucun participant pour le moment."
              />
            </CardContent>
          </Card>
        )}

        {tab === "complete" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {completeParticipants.length} participant{completeParticipants.length !== 1 ? "s" : ""} complet{completeParticipants.length !== 1 ? "s" : ""}
                </CardTitle>
                <ExportButtons filterMode="complete" />
              </div>
            </CardHeader>
            <CardContent>
              <ParticipantsTable
                participants={completeParticipants}
                emptyMessage="Aucun participant complet pour le moment."
              />
            </CardContent>
          </Card>
        )}

        {tab === "young" && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {youngCompleteParticipants.length} participant{youngCompleteParticipants.length !== 1 ? "s" : ""} (complet{youngCompleteParticipants.length !== 1 ? "s" : ""}, ≤ 30 ans)
                </CardTitle>
                <ExportButtons filterMode="young" />
              </div>
            </CardHeader>
            <CardContent>
              <ParticipantsTable
                participants={youngCompleteParticipants}
                emptyMessage="Aucun participant complet de 30 ans ou moins."
              />
            </CardContent>
          </Card>
        )}

        {tab === "stats" && (
          <Card>
            <CardHeader>
              <CardTitle>
                Statistiques agrégées — Précision par couleur
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.length > 0 && stats.some((s) => s.totalTrials > 0) ? (
                <StatsChart stats={stats} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Pas encore de données disponibles.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
