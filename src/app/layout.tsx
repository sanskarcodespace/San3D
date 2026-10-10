import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "San3D — A little more you.", template: "%s | San3D" },
  description: siteConfig.description,
  // Keep the demonstration out of search indexes until real products are approved.
  robots: { index: false, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
