export const CATEGORIES = [
  "Instruments de musique",
  "Véhicules",
  "Vêtements",
  "Sports",
  "Outils",
  "Meubles",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const WORDS_BY_CATEGORY: Record<Category, string[]> = {
  "Instruments de musique": [
    "Accordéon",
    "Batterie",
    "Clarinette",
    "Flûte",
    "Guitare",
    "Piano",
    "Violon",
    "Trompette",
  ],
  Véhicules: [
    "Voiture",
    "Avion",
    "Moto",
    "Bateau",
    "Hélicoptère",
    "Camion",
    "Train",
    "Scooteur",
  ],
  Vêtements: [
    "Anorak",
    "Blouson",
    "Ceinture",
    "Écharpe",
    "Gant",
    "Jaquette",
    "Pantalon",
    "Robe",
  ],
  Sports: [
    "Musculation",
    "Boxe",
    "Cyclisme",
    "Escrime",
    "Football",
    "Handball",
    "Judo",
    "Tennis",
  ],
  Outils: [
    "Ciseaux",
    "Foreuse",
    "Lime",
    "Marteau",
    "Scie",
    "Pelle",
    "Agrafeuse",
    "Tournevis",
  ],
  Meubles: [
    "Lit",
    "Etagère",
    "Armoire",
    "Chaise",
    "Table",
    "Bureau",
    "Fauteuil",
    "Porte",
  ],
};

export const COLORS = ["red", "yellow", "blue", "green"] as const;
export type ExperimentColor = (typeof COLORS)[number];

export const COLOR_HEX: Record<ExperimentColor, string> = {
  red: "#D32F2F",
  blue: "#1976D2",
  yellow: "#FFD600",
  green: "#2E7D32",
};

export const COLOR_LABELS: Record<ExperimentColor, string> = {
  red: "Rouge",
  blue: "Bleu",
  yellow: "Jaune",
  green: "Vert",
};

export function normalizeForComparison(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function checkWordCorrect(typed: string, correct: string): boolean {
  return normalizeForComparison(typed) === normalizeForComparison(correct);
}
