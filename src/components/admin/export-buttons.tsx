"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllTrials, getCompleteTrials } from "@/lib/actions";

export function ExportButtons({ completeOnly = false }: { completeOnly?: boolean }) {
  const [exporting, setExporting] = useState(false);

  const fetchTrials = completeOnly ? getCompleteTrials : getAllTrials;
  const csvFilename = completeOnly
    ? `participants-complets-${new Date().toISOString().slice(0, 10)}.csv`
    : `color-memory-trials-${new Date().toISOString().slice(0, 10)}.csv`;
  const pdfFilename = completeOnly
    ? `participants-complets-${new Date().toISOString().slice(0, 10)}.pdf`
    : `color-memory-report-${new Date().toISOString().slice(0, 10)}.pdf`;

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
      a.download = csvFilename;
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

      // Group by participant
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

      if (first) {
        // No data — don't save empty PDF
        return;
      }

      doc.save(pdfFilename);
    } finally {
      setExporting(false);
    }
  };

  const csvLabel = completeOnly ? "CSV (complets)" : "Export CSV";
  const pdfLabel = completeOnly ? "PDF (complets)" : "Export PDF";

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCSV} disabled={exporting}>
        {csvLabel}
      </Button>
      <Button variant="outline" size="sm" onClick={handlePDF} disabled={exporting}>
        {pdfLabel}
      </Button>
    </div>
  );
}
