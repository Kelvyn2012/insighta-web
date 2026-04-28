"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Profile {
  id: string;
  name: string;
  gender: string;
  gender_probability: number;
  age: number;
  age_group: string;
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at: string;
}

interface ProfilesResponse {
  status: string;
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  links: { self: string; next: string | null; prev: string | null };
  data: Profile[];
}

function ProfilesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [meta, setMeta] = useState<Omit<ProfilesResponse, "data"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Filter state
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [ageGroup, setAgeGroup] = useState(searchParams.get("age_group") || "");
  const [country, setCountry] = useState(searchParams.get("country_id") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "");
  const [order, setOrder] = useState(searchParams.get("order") || "asc");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError("");
    setIsSearchMode(false);

    const params = new URLSearchParams();
    if (gender) params.set("gender", gender);
    if (ageGroup) params.set("age_group", ageGroup);
    if (country) params.set("country_id", country);
    if (sortBy) { params.set("sort_by", sortBy); params.set("order", order); }
    params.set("page", String(page));
    params.set("limit", "20");

    try {
      const resp = await fetch(`/api/profiles?${params.toString()}`);
      if (resp.status === 401) { router.push("/"); return; }
      const data: ProfilesResponse = await resp.json();
      setProfiles(data.data || []);
      setMeta(data);
    } catch {
      setError("Failed to load profiles.");
    } finally {
      setLoading(false);
    }
  }, [gender, ageGroup, country, sortBy, order, page, router]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setIsSearchMode(true);

    try {
      const resp = await fetch(
        `/api/profiles/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      if (resp.status === 401) { router.push("/"); return; }
      const data: ProfilesResponse = await resp.json();
      if (data.status === "error") { setError(data as unknown as string || "No results"); setProfiles([]); }
      else { setProfiles(data.data || []); setMeta(data); }
    } catch {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (gender) params.set("gender", gender);
    if (ageGroup) params.set("age_group", ageGroup);
    if (country) params.set("country_id", country);
    params.set("format", "csv");
    window.location.href = `/api/profiles/export?${params.toString()}`;
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <span style={s.logo}>Insighta Labs+</span>
        <div style={s.headerRight}>
          <button onClick={handleExport} style={s.exportBtn}>Export CSV</button>
          <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={s.main}>
        {/* Search bar */}
        <form onSubmit={handleSearch} style={s.searchForm}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Natural language search: "young males from nigeria"'
            style={s.searchInput}
          />
          <button type="submit" style={s.searchBtn}>Search</button>
          {isSearchMode && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); fetchProfiles(); }}
              style={s.clearBtn}
            >
              Clear
            </button>
          )}
        </form>

        {/* Filters */}
        {!isSearchMode && (
          <div style={s.filters}>
            <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }} style={s.select}>
              <option value="">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select value={ageGroup} onChange={(e) => { setAgeGroup(e.target.value); setPage(1); }} style={s.select}>
              <option value="">All age groups</option>
              <option value="child">Child</option>
              <option value="teenager">Teenager</option>
              <option value="adult">Adult</option>
              <option value="senior">Senior</option>
            </select>
            <input
              value={country}
              onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              placeholder="Country code (e.g. NG)"
              style={{ ...s.select, width: 160 }}
              maxLength={3}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={s.select}>
              <option value="">Default sort</option>
              <option value="age">Age</option>
              <option value="gender_probability">Gender prob.</option>
              <option value="created_at">Created</option>
            </select>
            <select value={order} onChange={(e) => setOrder(e.target.value)} style={s.select}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        )}

        {/* Error */}
        {error && <div style={s.error}>{error}</div>}

        {/* Table */}
        {loading ? (
          <div style={s.loading}>Loading profiles…</div>
        ) : (
          <>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Name", "Gender", "Age", "Age Group", "Country", "G.Prob", "C.Prob"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profiles.length === 0 ? (
                    <tr><td colSpan={7} style={s.empty}>No profiles found.</td></tr>
                  ) : profiles.map((p) => (
                    <tr key={p.id} style={s.tr}>
                      <td style={s.td}><strong>{p.name}</strong></td>
                      <td style={s.td}>{p.gender}</td>
                      <td style={{ ...s.td, textAlign: "right" }}>{p.age}</td>
                      <td style={s.td}>{p.age_group}</td>
                      <td style={s.td}>{p.country_id} {p.country_name && `(${p.country_name})`}</td>
                      <td style={{ ...s.td, textAlign: "right" }}>{p.gender_probability.toFixed(2)}</td>
                      <td style={{ ...s.td, textAlign: "right" }}>{p.country_probability.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && !isSearchMode && meta.total_pages > 1 && (
              <div style={s.pagination}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={s.pageBtn}
                >
                  ← Prev
                </button>
                <span style={s.pageInfo}>
                  Page {meta.page} of {meta.total_pages} — {meta.total} total
                </span>
                <button
                  disabled={page >= meta.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  style={s.pageBtn}
                >
                  Next →
                </button>
              </div>
            )}

            {meta && (
              <div style={s.resultCount}>
                {isSearchMode ? `${meta.total} search results` : `${meta.total} total profiles`}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ProfilesPage() {
  return (
    <Suspense fallback={<div style={{ color: "#fff", padding: 40 }}>Loading…</div>}>
      <ProfilesContent />
    </Suspense>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e2e8f0" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #1e293b", background: "#1e293b" },
  logo: { fontWeight: 700, fontSize: 18, color: "#f1f5f9" },
  headerRight: { display: "flex", gap: 12 },
  exportBtn: { background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  logoutBtn: { background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, padding: "7px 16px", cursor: "pointer", fontSize: 13 },
  main: { maxWidth: 1200, margin: "0 auto", padding: "24px 32px" },
  searchForm: { display: "flex", gap: 8, marginBottom: 20 },
  searchInput: { flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "10px 16px", color: "#e2e8f0", fontSize: 14, outline: "none" },
  searchBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  clearBtn: { background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 14 },
  filters: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const },
  select: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13, cursor: "pointer" },
  error: { background: "#450a0a", border: "1px solid #991b1b", color: "#fca5a5", borderRadius: 8, padding: "10px 16px", marginBottom: 16 },
  loading: { textAlign: "center", color: "#64748b", padding: 60 },
  tableWrap: { overflowX: "auto" as const },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 14 },
  th: { textAlign: "left" as const, padding: "10px 14px", borderBottom: "2px solid #334155", color: "#94a3b8", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" as const },
  tr: { borderBottom: "1px solid #1e293b" },
  td: { padding: "10px 14px", color: "#cbd5e1" },
  empty: { textAlign: "center" as const, padding: 40, color: "#64748b" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 24 },
  pageBtn: { background: "#1e293b", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 8, padding: "8px 16px", cursor: "pointer" },
  pageInfo: { color: "#94a3b8", fontSize: 14 },
  resultCount: { textAlign: "center" as const, color: "#64748b", fontSize: 13, marginTop: 12 },
};
