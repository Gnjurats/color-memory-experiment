"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { COLOR_HEX, COLOR_LABELS, type ExperimentColor } from "@/lib/stimuli";

type StatsRow = {
  color: string;
  totalTrials: number;
  colorAccuracy: number;
  wordAccuracy: number;
  avgConfidenceCorrect: number;
  avgConfidenceIncorrect: number;
};

export function StatsChart({ stats }: { stats: StatsRow[] }) {
  const chartData = stats.map((s) => ({
    name: COLOR_LABELS[s.color as ExperimentColor],
    "Précision couleur (%)": Math.round(s.colorAccuracy * 100),
    "Confiance (correct)": Number(s.avgConfidenceCorrect.toFixed(2)),
    "Confiance (incorrect)": Number(s.avgConfidenceIncorrect.toFixed(2)),
    fill: COLOR_HEX[s.color as ExperimentColor],
  }));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-4">
          Précision de rappel des couleurs par couleur originale
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar
              dataKey="Précision couleur (%)"
              fill="#666"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">
          Confiance moyenne — réponses correctes vs incorrectes
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 4]} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="Confiance (correct)"
              fill="#4ade80"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Confiance (incorrect)"
              fill="#f87171"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.color}
            className="rounded-lg border p-4 text-center space-y-1"
          >
            <div
              className="w-6 h-6 rounded-full mx-auto"
              style={{
                backgroundColor: COLOR_HEX[s.color as ExperimentColor],
              }}
            />
            <p className="text-xs text-muted-foreground">
              {COLOR_LABELS[s.color as ExperimentColor]}
            </p>
            <p className="text-2xl font-bold">
              {Math.round(s.colorAccuracy * 100)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {s.totalTrials} essais
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
