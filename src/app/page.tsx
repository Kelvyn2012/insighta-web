import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const jar = await cookies();
  const hasToken = jar.has("access_token") || jar.has("refresh_token");
  if (hasToken) redirect("/profiles");

  const { error } = await searchParams;

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Insighta Labs+</h1>
        <p style={styles.subtitle}>Intelligence Query Engine</p>

        {error && (
          <div style={styles.errorBanner}>
            {decodeURIComponent(error).replace(/_/g, " ")}
          </div>
        )}

        <a href="/api/auth/login" style={styles.loginBtn}>
          <GithubIcon />
          Login with GitHub
        </a>

        <p style={styles.note}>
          Analyst and admin access controlled by your GitHub account role.
        </p>
      </div>
    </main>
  );
}

function GithubIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ marginRight: 8, verticalAlign: "middle" }}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 16,
    padding: "48px 40px",
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
  },
  title: {
    color: "#f1f5f9",
    fontSize: 28,
    fontWeight: 700,
    margin: "0 0 8px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    margin: "0 0 32px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  errorBanner: {
    background: "#450a0a",
    border: "1px solid #991b1b",
    color: "#fca5a5",
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 14,
    marginBottom: 20,
    textTransform: "capitalize",
  },
  loginBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    color: "#0f172a",
    padding: "12px 28px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 15,
    textDecoration: "none",
    transition: "background 0.2s",
    cursor: "pointer",
  },
  note: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 20,
    lineHeight: 1.6,
  },
};
