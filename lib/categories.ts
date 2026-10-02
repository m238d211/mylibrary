// Names must match public.categories and the values returned by classifyTool.
export const CATEGORIES = [
  { name: "Frameworks", slug: "frameworks", description: "UI libraries, meta-frameworks and server frameworks.", tint: "bg-orange-50 text-orange-700" },
  { name: "State Management", slug: "state-management", description: "Stores and patterns for application state.", tint: "bg-violet-50 text-violet-700" },
  { name: "Testing", slug: "testing", description: "Unit, integration, end-to-end and component testing.", tint: "bg-emerald-50 text-emerald-700" },
  { name: "Styling and UI", slug: "styling-and-ui", description: "CSS tooling, component kits and design primitives.", tint: "bg-pink-50 text-pink-700" },
  { name: "Data Fetching", slug: "data-fetching", description: "HTTP clients, caching and server-state libraries.", tint: "bg-sky-50 text-sky-700" },
  { name: "Forms and Validation", slug: "forms-and-validation", description: "Form state, schemas and runtime validation.", tint: "bg-amber-50 text-amber-700" },
  { name: "Authentication", slug: "authentication", description: "Sign-in, sessions, OAuth and token handling.", tint: "bg-rose-50 text-rose-700" },
  { name: "Database and ORM", slug: "database-and-orm", description: "ORMs, query builders and database drivers.", tint: "bg-teal-50 text-teal-700" },
  { name: "Build Tools", slug: "build-tools", description: "Bundlers, compilers and dev servers.", tint: "bg-yellow-50 text-yellow-700" },
  { name: "Animation", slug: "animation", description: "Motion, transitions and gesture libraries.", tint: "bg-fuchsia-50 text-fuchsia-700" },
  { name: "Accessibility", slug: "accessibility", description: "Auditing and accessible building blocks.", tint: "bg-indigo-50 text-indigo-700" },
  { name: "Developer Experience", slug: "developer-experience", description: "Linters, type tooling and debugging aids.", tint: "bg-cyan-50 text-cyan-700" },
  { name: "Other", slug: "other", description: "Useful tools that do not fit a single category.", tint: "bg-zinc-100 text-zinc-700" },
] as const;

export type CategoryInfo = (typeof CATEGORIES)[number];
export const CATEGORY_NAMES: readonly string[] = CATEGORIES.map((category) => category.name);
export const categoryInfo = (name: string): CategoryInfo => CATEGORIES.find((category) => category.name === name) ?? CATEGORIES[CATEGORIES.length - 1];
