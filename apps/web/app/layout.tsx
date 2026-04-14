import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collaborative 3D Design Tool",
  description: "Starter collaborative 3D concept modeling workspace."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
