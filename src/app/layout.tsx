import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insighta Web",
  description: "Insighta Labs+ Web Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
