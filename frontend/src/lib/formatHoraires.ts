// Formate les horaires en regroupant les jours consécutifs avec les mêmes créneaux
// Input: "Lundi 09:00-18:00, Mardi 09:00-18:00, Mercredi 09:00-18:00, Samedi 09:00-12:00"
// Output: ["Lundi au Mercredi : 9h - 18h", "Samedi : 9h - 12h"]

const ORDRE_JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function formatTime(t: string): string {
  // "09:00" → "9h", "18:30" → "18h30"
  const [h, m] = t.split(":");
  const hNum = parseInt(h, 10);
  return m === "00" ? `${hNum}h` : `${hNum}h${m}`;
}

export function formatHoraires(horaires: string | undefined): string[] {
  if (!horaires) return [];

  // Parser chaque entrée "Jour HH:MM-HH:MM"
  const entries: { jour: string; creneau: string }[] = [];
  for (const part of horaires.split(",")) {
    const trimmed = part.trim();
    const match = trimmed.match(/^(\w+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (match) {
      entries.push({
        jour: match[1],
        creneau: `${match[2]}-${match[3]}`,
      });
    }
  }

  if (entries.length === 0) return [horaires]; // fallback texte brut

  // Trier par ordre de la semaine
  entries.sort(
    (a, b) => ORDRE_JOURS.indexOf(a.jour) - ORDRE_JOURS.indexOf(b.jour)
  );

  // Regrouper les jours consécutifs avec le même créneau
  const groups: { jours: string[]; creneau: string }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    const lastJour = last?.jours[last.jours.length - 1];
    const isConsecutive =
      last &&
      last.creneau === entry.creneau &&
      ORDRE_JOURS.indexOf(entry.jour) === ORDRE_JOURS.indexOf(lastJour) + 1;

    if (isConsecutive) {
      last.jours.push(entry.jour);
    } else {
      groups.push({ jours: [entry.jour], creneau: entry.creneau });
    }
  }

  // Formater chaque groupe
  return groups.map(({ jours, creneau }) => {
    const [start, end] = creneau.split("-");
    const timeStr = `${formatTime(start)} - ${formatTime(end)}`;

    if (jours.length === 1) {
      return `${jours[0]} : ${timeStr}`;
    } else if (jours.length === 2) {
      return `${jours[0]} et ${jours[1]} : ${timeStr}`;
    } else {
      return `${jours[0]} au ${jours[jours.length - 1]} : ${timeStr}`;
    }
  });
}
