import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: "https://mylibrary.dev", lastModified: new Date() }, { url: "https://mylibrary.dev/tools", lastModified: new Date() }, { url: "https://mylibrary.dev/categories", lastModified: new Date() }]; }
