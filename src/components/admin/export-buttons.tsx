"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getAllTrials,
  getCompleteTrials,
  getYoungCompleteTrials,
  getTrialsWithTimestamps,
  getCompleteTrialsWithTimestamps,
  getYoungCompleteTrialsWithTimestamps,
} from "@/lib/actions";

type FilterMode = "all" | "complete" | "young";

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const CONFIG: Record<FilterMode, {
  csvLabel: string;
  pdfLabel: string;
  xlsxLabel: string;
  csvPrefix: string;
  pdfPrefix: string;
  xlsxPrefix: string;
}> = {
  all: {
    csvLabel: "Export CSV",
    pdfLabel: "Export PDF",
    xlsxLabel: "Exporter Excel",
    csvPrefix: "color-memory-trials",
    pdfPrefix: "color-memory-report",
    xlsxPrefix: "experiment-data",
  },
  complete: {
    csvLabel: "CSV (complets)",
    pdfLabel: "PDF (complets)",
    xlsxLabel: "Excel (complets)",
    csvPrefix: "participants-complets",
    pdfPrefix: "participants-complets",
    xlsxPrefix: "participants-complets",
  },
  young: {
    csvLabel: "CSV (≤ 30 ans)",
    pdfLabel: "PDF (≤ 30 ans)",
    xlsxLabel: "Excel (≤ 30 ans)",
    csvPrefix: "participants-30ans",
    pdfPrefix: "participants-30ans",
    xlsxPrefix: "participants-30ans",
  },
};

const TRIAL_FETCHERS: Record<FilterMode, () => ReturnType<typeof getAllTrials>> = {
  all: getAllTrials,
  complete: getCompleteTrials,
  young: getYoungCompleteTrials,
};

const TS_FETCHERS: Record<FilterMode, () => ReturnType<typeof getTrialsWithTimestamps>> = {
  all: getTrialsWithTimestamps,
  complete: getCompleteTrialsWithTimestamps,
  young: getYoungCompleteTrialsWithTimestamps,
};

export function ExportButtons({ filterMode = "all" }: { filterMode?: FilterMode; completeOnly?: boolean }) {
  const [exporting, setExporting] = useState(false);

  const cfg = CONFIG[filterMode];
  const dateStr = new Date().toISOString().slice(0, 10);
  const fetchTrials = TRIAL_FETCHERS[filterMode];
  const fetchTrialsWithTs = TS_FETCHERS[filterMode];

  const handleCSV = async () => {
    setExporting(true);
    try {
      const trials = await fetchTrials();
      const Papa = (await import("papaparse")).default;

      const csv = Papa.unparse(
        trials.map((t) => ({
          participant_id: t.participantId,
          pseudo: t.pseudo || "",
          age: t.age ?? "",
          gender: t.gender || "",
          word: t.word,
          category: t.category,
          original_color: t.originalColor,
          typed_answer: t.typedAnswer,
          word_correct: t.wordCorrect,
          selected_color: t.selectedColor,
          color_correct: t.colorCorrect,
          confidence: t.confidence,
          test_order: t.testOrder,
        }))
      );

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cfg.csvPrefix}-${dateStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handlePDF = async () => {
    setExporting(true);
    try {
      const trials = await fetchTrials();
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      const autoTable = (await import("jspdf-autotable")).default;

      const grouped = new Map<string, typeof trials>();
      for (const t of trials) {
        const existing = grouped.get(t.participantId) || [];
        existing.push(t);
        grouped.set(t.participantId, existing);
      }

      const doc = new jsPDF();
      let first = true;

      for (const [pid, pTrials] of grouped) {
        if (!first) doc.addPage();
        first = false;

        const pseudo = pTrials[0]?.pseudo || "Anonyme";
        doc.setFontSize(16);
        doc.text(`Participant: ${pseudo}`, 14, 20);
        doc.setFontSize(10);
        const ageVal = pTrials[0]?.age ?? "—";
        const genderVal = pTrials[0]?.gender || "—";
        doc.text(`ID: ${pid} | Âge: ${ageVal} | Genre: ${genderVal}`, 14, 28);

        const colorCorrect = pTrials.filter((t) => t.colorCorrect).length;
        const wordCorrect = pTrials.filter((t) => t.wordCorrect).length;
        doc.text(
          `Mots corrects: ${wordCorrect}/48 | Couleurs correctes: ${colorCorrect}/48`,
          14,
          36
        );

        autoTable(doc, {
          startY: 42,
          head: [
            [
              "#",
              "Categorie",
              "Mot",
              "Reponse",
              "Mot OK",
              "Couleur orig.",
              "Couleur choisie",
              "Couleur OK",
              "Confiance",
            ],
          ],
          body: pTrials.map((t) => [
            t.testOrder + 1,
            t.category,
            t.word,
            t.typedAnswer,
            t.wordCorrect ? "Oui" : "Non",
            t.originalColor,
            t.selectedColor,
            t.colorCorrect ? "Oui" : "Non",
            t.confidence,
          ]),
          styles: { fontSize: 7 },
          headStyles: { fillColor: [41, 41, 41] },
        });
      }

      if (first) return;
      doc.save(`${cfg.pdfPrefix}-${dateStr}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const handleExcel = async () => {
    setExporting(true);
    try {
      const trials = await fetchTrialsWithTs();
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();

      const participantsSheet = workbook.addWorksheet("Participants");
      participantsSheet.columns = [
        { header: "participant_id", key: "id", width: 38 },
        { header: "pseudo", key: "pseudo", width: 20 },
        { header: "age", key: "age", width: 8 },
        { header: "gender", key: "gender", width: 12 },
        { header: "started_at", key: "startedAt", width: 22 },
        { header: "completed_at", key: "completedAt", width: 22 },
        { header: "total_trials", key: "totalTrials", width: 12 },
      ];

      const grouped = new Map<string, typeof trials>();
      for (const t of trials) {
        const existing = grouped.get(t.participantId) || [];
        existing.push(t);
        grouped.set(t.participantId, existing);
      }

      for (const [pid, pTrials] of grouped) {
        participantsSheet.addRow({
          id: pid,
          pseudo: pTrials[0]?.pseudo || "",
          age: pTrials[0]?.age ?? "",
          gender: pTrials[0]?.gender || "",
          startedAt: formatDate(pTrials[0]?.startedAt),
          completedAt: formatDate(pTrials[0]?.completedAt),
          totalTrials: pTrials.length,
        });
      }

      const pHeaderRow = participantsSheet.getRow(1);
      pHeaderRow.font = { bold: true };
      participantsSheet.views = [{ state: "frozen", ySplit: 1 }];

      const trialsSheet = workbook.addWorksheet("Trials");
      trialsSheet.columns = [
        { header: "participant_id", key: "participantId", width: 38 },
        { header: "pseudo", key: "pseudo", width: 20 },
        { header: "test_order", key: "testOrder", width: 12 },
        { header: "category", key: "category", width: 22 },
        { header: "correct_word", key: "word", width: 18 },
        { header: "typed_answer", key: "typedAnswer", width: 18 },
        { header: "word_correct", key: "wordCorrect", width: 14 },
        { header: "original_color", key: "originalColor", width: 16 },
        { header: "selected_color", key: "selectedColor", width: 16 },
        { header: "color_correct", key: "colorCorrect", width: 14 },
        { header: "confidence", key: "confidence", width: 12 },
        { header: "created_at", key: "createdAt", width: 22 },
      ];

      for (const t of trials) {
        trialsSheet.addRow({
          participantId: t.participantId,
          pseudo: t.pseudo || "",
          testOrder: t.testOrder + 1,
          category: t.category,
          word: t.word,
          typedAnswer: t.typedAnswer,
          wordCorrect: t.wordCorrect ? "Oui" : "Non",
          originalColor: t.originalColor,
          selectedColor: t.selectedColor,
          colorCorrect: t.colorCorrect ? "Oui" : "Non",
          confidence: t.confidence,
          createdAt: formatDate(t.trialCreatedAt),
        });
      }

      const tHeaderRow = trialsSheet.getRow(1);
      tHeaderRow.font = { bold: true };
      trialsSheet.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cfg.xlsxPrefix}-${dateStr}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCSV} disabled={exporting}>
        {cfg.csvLabel}
      </Button>
      <Button variant="outline" size="sm" onClick={handlePDF} disabled={exporting}>
        {cfg.pdfLabel}
      </Button>
      <Button variant="outline" size="sm" onClick={handleExcel} disabled={exporting}>
        {cfg.xlsxLabel}
      </Button>
    </div>
  );
}
