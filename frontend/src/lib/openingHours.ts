/**
 * Regroupe les jours consécutifs avec les mêmes horaires pour l'affichage.
 * Ex. : Lundi au Vendredi 9h - 18h, Samedi 9h - 12h, Dimanche Fermé
 */

export type OpeningHoursDay = { open?: boolean; start?: string; end?: string };
export type OpeningHoursRecord = Record<string, OpeningHoursDay>;

const ORDER: (keyof OpeningHoursRecord)[] = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

export function formatHour(h: string): string {
  if (!h) return "";
  const s = h.startsWith("0") ? h.slice(1) : h;
  return s.replace(":00", "h");
}

function getSignature(day: OpeningHoursDay | undefined): string {
  if (!day?.open || !day?.start || !day?.end) return "closed";
  return `${day.start}-${day.end}`;
}

export function formatOpeningHoursGrouped(
  openingHours: OpeningHoursRecord
): { label: string; text: string }[] {
  const result: { label: string; text: string }[] = [];
  let i = 0;
  while (i < ORDER.length) {
    const key = ORDER[i];
    const day = openingHours[key];
    const sig = getSignature(day);
    const text =
      sig === "closed"
        ? "Fermé"
        : `${formatHour(day!.start!)} - ${formatHour(day!.end!)}`;
    let j = i + 1;
    while (j < ORDER.length && getSignature(openingHours[ORDER[j]]) === sig) {
      j++;
    }
    const firstLabel = LABELS[ORDER[i]];
    const lastLabel = LABELS[ORDER[j - 1]];
    const label = j - i === 1 ? firstLabel : `${firstLabel} au ${lastLabel}`;
    result.push({ label, text });
    i = j;
  }
  return result;
}
