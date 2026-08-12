import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mylibrary.dev"),
  title: {
    default: "MyLibrary — Web development tools worth knowing",
    template: "%s | MyLibrary",
  },
  description:
    "A clear, data-backed directory of useful and recently active web-development tools.",
  openGraph: {
    title: "MyLibrary",
    description: "Discover useful web-development tools.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
