const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en");

export const formatCompact = (value: number | null) => (value === null ? "—" : compact.format(value));
export const formatNumber = (value: number | null) => (value === null ? "Unavailable" : full.format(value));
export const formatDate = (value: string | null) => {
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(time) ? "Unavailable" : new Date(time).toLocaleDateString("en", { dateStyle: "medium" });
};
// Older rows were stored before URLs were sanitized, so only render http(s) links.
export const safeLink = (value: string | null) => (value && /^https?:\/\//i.test(value) ? value : null);
