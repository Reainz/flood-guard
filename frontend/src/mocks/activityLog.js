// Placeholder data for screens/ActivityLog.jsx — see ./README.md

export const ENTRY_TYPES = ["disease", "growth", "expense", "note"];

export const TYPE_STYLE = {
  disease: { color: "var(--red)", dim: "var(--red-dim)" },
  growth: { color: "var(--green)", dim: "var(--green-dim)" },
  expense: { color: "var(--amber)", dim: "var(--amber-dim)" },
  note: { color: "var(--blue)", dim: "var(--blue-dim)" },
};

/**
 * Newest first. `bodyKey` resolves against `activity.samples.*` in the locale files;
 * entries the user adds during a session carry a literal `body` instead.
 * `amountVnd` is present only on expense entries.
 */
export const ENTRIES = [
  {
    id: "e1",
    type: "disease",
    date: "2026-03-11",
    titleKey: "leaf_blast_spotted",
    bodyKey: "leaf_blast_spotted",
  },
  {
    id: "e2",
    type: "expense",
    date: "2026-03-11",
    titleKey: "fungicide_purchase",
    bodyKey: "fungicide_purchase",
    amountVnd: 480000,
  },
  {
    id: "e3",
    type: "growth",
    date: "2026-03-09",
    titleKey: "grain_filling_start",
    bodyKey: "grain_filling_start",
  },
  {
    id: "e4",
    type: "expense",
    date: "2026-03-05",
    titleKey: "fertiliser_top_dressing",
    bodyKey: "fertiliser_top_dressing",
    amountVnd: 1250000,
  },
  {
    id: "e5",
    type: "note",
    date: "2026-03-05",
    titleKey: "canal_water_low",
    bodyKey: "canal_water_low",
  },
  {
    id: "e6",
    type: "growth",
    date: "2026-02-27",
    titleKey: "heading_complete",
    bodyKey: "heading_complete",
  },
  {
    id: "e7",
    type: "expense",
    date: "2026-02-20",
    titleKey: "labour_weeding",
    bodyKey: "labour_weeding",
    amountVnd: 900000,
  },
];

/** Groups entries by ISO date, preserving the newest-first order. */
export function groupByDate(entries) {
  const groups = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) last.entries.push(entry);
    else groups.push({ date: entry.date, entries: [entry] });
  }
  return groups;
}

/** Total VND spent across a group's expense entries; 0 when there are none. */
export function groupExpenseTotal(entries) {
  return entries.reduce((sum, entry) => sum + (entry.amountVnd || 0), 0);
}

export function formatVnd(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}
