import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insighta Labs+ | Intelligence Query Engine",
  description: "Demographic profile intelligence platform with GitHub OAuth and role-based access",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, boxSizing: "border-box" }}>
        {children}
      </body>
    </html>
  );
}
