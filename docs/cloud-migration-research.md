# Cloud Migration & Storage Research

_Research note — what it would take to run **everything** in the cloud, what the
storage footprint actually is, and how far the free tiers carry it. Figures
checked June 2026 against live pricing pages (see Sources). Corpus sizes and
schema facts are read directly from this repo, not estimated._

## TL;DR

**Almost everything is already cloud.** The Next.js app runs on Vercel, the
database/auth/vector store runs on Supabase, the narrator LLM and scene-art
calls are browser-direct BYOK (the player's own provider), and the RAG
ingestion pipeline already runs in GitHub Actions. The **only** component that
is not cloud-native is the **always-on embedding endpoint** — a resident
0.6B-class model that embeds the player's query each turn. A serverless
function cannot hold a model in memory, so this is the one piece a "move
everything to the cloud" effort has to actually solve.

**Storage is small and fits the free tiers.** The committed corpus is **~53 MB**
of Git LFS files; the loaded vector store is **~125–160 MB** at the measured
chunk count (worst-case ~350 MB). Both sit inside Supabase's free **500 MB**
database and GitHub's free **10 GB** LFS quotas. The existing budget doc's
"Supabase Pro required" line is an *operational* call (no 7-day pause, backups,
egress headroom) — **not** a storage-capacity limit.

**A fully-free, fully-cloud hobby deployment is feasible** by swapping the
operator's VPS embedding box for Hugging Face's free Inference tier — at the
cost of cold-start latency and a monthly credit ceiling. It breaks at three
known points (below), each of which is a known paid upgrade.

---

## 1. Current architecture — what already lives in the cloud

| Layer | Today | Cloud-native? |
| --- | --- | --- |
| Frontend + API routes | Next.js 16 / React 19 on Vercel | ✅ Yes (serverless) |
| Auth | Supabase Auth (email/password, magic link, OTP) | ✅ Yes |
| Database + RLS | Supabase Postgres 17 | ✅ Yes |
| Vector store | Supabase **pgvector** (`chunk_embeddings`, `vector(1024)`) | ✅ Yes |
| Full-text search | Postgres generated `tsv` + GIN, fused via `match_source_chunks` RPC | ✅ Yes |
| Narrator LLM | Browser-direct **BYOK** (Anthropic / OpenAI / OpenRouter / Ollama / Ollama Cloud / custom) | ✅ Player's cloud |
| Scene art | Browser-direct OpenAI image API (optional), cached in IndexedDB | ✅ Player's cloud |
| Corpus source files | Novel EPUB + wiki XML in **Git LFS** | ✅ GitHub |
| RAG ingestion (parse → chunk → embed → load) | GitHub Actions (`.github/workflows/rag-ingest.yml`) | ✅ CI |
| **Query-time embedding endpoint** | **Always-on operator VPS running Ollama** (`NEXT_PUBLIC_OPERATOR_EMBEDDING_URL`) | ❌ **Not serverless** |

Source: `src/lib/ai/embeddings.ts:47–64,99–103`, `docs/rag-per-turn-budget.md`,
`docs/rag-ingestion.md`, `supabase/migrations/`.

---

## 2. The one real gap: the always-on embedding endpoint

Every turn, the player's action text must be embedded with the **exact same
model** that embedded the corpus (`qwen3-embedding-0.6b` default, or `bge-m3`),
both 1024-dim — a query vector is only comparable to corpus vectors from the
same map (`src/lib/ai/embeddings.ts:26,47–64`). That requires a process holding
the model resident in memory:

- **Cannot run on Vercel** — serverless functions are stateless and killed
  after each invocation; there is no resident model. (`docs/rag-per-turn-budget.md:35`)
- **Players using their own Ollama** hit `localhost` and need nothing from the
  operator. The operator endpoint is the **zero-setup fallback** for everyone
  else.

This is the crux of "move everything to the cloud": the question is really
*"where does the query-embedding model live, and what does that cost?"*

**Options for a cloud-hosted embedding endpoint:**

| Option | Cost | Trade-off |
| --- | --- | --- |
| Self-hosted VPS w/ Ollama (current model) | ~$8–20/mo flat (4-vCPU) | Always warm, predictable; not free; you operate it |
| Hugging Face Inference (free tier) | **$0** — 100K monthly inference credits, CPU/ZeroGPU | Cold starts, monthly credit ceiling; `bge-m3` + `qwen3-embedding` both available on HF |
| Modal / RunPod serverless GPU | Pay-per-second, scale-to-zero | Cheap at low volume; cold starts; per-request billing scales with players |
| Ollama Cloud (free tier) | $0 | GPU-time quotas, 1 concurrent model, embedding support not contractually guaranteed |

The model must be served identically to the corpus map, which rules out
"any embedding API" — the dimension **and** the weights have to match. `bge-m3`
is the safest cloud-portable choice (ubiquitous); `qwen3-embedding-0.6b` is also
on HF but less universally hosted.

---

## 3. Storage footprint — measured, not estimated

### Corpus source files (Git LFS, read from pointers)

| File | Size |
| --- | --- |
| `corpus/novel/LordofMysteriesCuttlefishTha1.EPUB` | 30,934,293 B (~29.5 MB) |
| `corpus/wiki/lordofthemystery_pages_current.xml` | 21,525,253 B (~20.5 MB) |
| `corpus/wiki/lordofthemystery_pages_current.xml.7z` | 3,320,693 B (~3.2 MB) |
| **Total LFS** | **~53 MB** |

(The earlier "~500 MB EPUB" guess elsewhere was wrong — the real EPUB is 30 MB.)

### Loaded into Supabase

Measured target from `docs/rag-ingestion.md`: **7,887 chunks** (5,684 novel +
2,203 wiki). Each 1024-dim float32 vector is 1024 × 4 B ≈ **4 KB** raw; an HNSW
index roughly doubles that.

| Component | At 7,887 chunks | Notes |
| --- | --- | --- |
| `source_chunks` content text | ~16 MB | ~500 avg tokens/chunk |
| Embeddings, 1 model map (raw) | ~31 MB | 7,887 × 4 KB |
| Embeddings, 2 maps + HNSW index | ~125 MB | both approved models |
| FTS GIN index (`tsv`) | ~2–3 MB | |
| Hand-authored `lore_entries` + embeddings | ~1–2 MB | |
| **Total static corpus in Postgres** | **~140–160 MB** | |
| Player-accumulated data (journal, world messages, market, showcases) | grows with play, ~1 KB/row | unbounded over time |

The `rag-per-turn-budget.md` doc uses a conservative **~30k-chunk / ~250 MB**
placeholder; even at that worst case the store is **~350 MB — still under the
free 500 MB**, though tight.

---

## 4. Free-tier mapping (June 2026)

| Service | Free tier | Headroom for this project |
| --- | --- | --- |
| **Vercel Hobby** | 100 GB bandwidth, 100K function invocations, 10 s function limit, 4 CPU-hrs, 100 build-min/mo | ✅ Ample — **but Hobby is non-commercial/personal use only** |
| **Supabase Free** | 500 MB database, 1 GB file storage, 5 GB egress + 5 GB cached egress, 50,000 MAU, **pgvector included** | ✅ Corpus fits; ⚠️ **pauses after 7 days inactivity**, 2-project cap, no backups |
| **GitHub LFS** | 10 GB storage + 10 GB bandwidth/mo (Free/Pro) | ✅ 53 MB corpus is trivial |
| **Hugging Face Inference (embeddings)** | 100K inference credits/mo, free CPU Spaces (2 vCPU/16 GB), ZeroGPU 3.5 min/day | ⚠️ Viable for the embed endpoint at hobby volume; cold starts |
| **Narrator LLM** | n/a — **BYOK**, player pays their own provider | ✅ $0 to operator |

Key correction to the existing budget doc: **pgvector is free on every Supabase
plan** (confirmed on Supabase pricing). The corpus fits the free 500 MB. The
reason to pay $25/mo Pro is the **7-day inactivity pause**, daily backups, and
egress/reliability — operational, not capacity.

---

## 5. A fully-free, fully-cloud configuration (and where it breaks)

It is possible to run the **entire** stack in the cloud at **$0 operator cost**:

- **Vercel Hobby** — app + API routes
- **Supabase Free** — DB, auth, pgvector, FTS (corpus ~150 MB < 500 MB)
- **GitHub Free** — repo, LFS corpus, Actions ingestion
- **Hugging Face free Inference** — query-embedding endpoint (`bge-m3`)
- **BYOK** — narrator LLM and scene art (player's cost, not operator's)

**Where this breaks — the three known upgrade triggers:**

1. **Commercial use** → Vercel Hobby is personal-use-only. Any monetization or
   "commercial" framing requires **Vercel Pro (~$20/mo)**.
2. **Traffic / "always available"** → Supabase Free **pauses after 7 days
   idle** and caps egress at 5 GB/mo. A live game with returning players needs
   **Supabase Pro (~$25/mo)** to stay warm with backups.
3. **Embedding throughput / latency** → HF free credits and cold starts won't
   carry sustained concurrent play. At that point you move to a **flat
   ~$8–20/mo VPS** (current operator model) or **serverless GPU** (Modal/RunPod,
   pay-per-use).

So the realistic "production-ready, everything-in-the-cloud" floor is the
existing budget doc's number: **~$33–45/mo** (Supabase Pro + embed box),
optionally **+$20** if commercial (Vercel Pro). Everything between $0 and that
is a graceful degradation, not a wall.

---

## 6. What "moving everything to the cloud" actually requires

Because the app, DB, auth, vector store, and ingestion are already cloud, the
migration checklist is short:

1. **Stand up a cloud embedding endpoint** serving the corpus model (`bge-m3`
   recommended for portability). Pick: HF Inference (free, hobby) → VPS (flat) →
   serverless GPU (scale). Point `NEXT_PUBLIC_OPERATOR_EMBEDDING_URL` at it.
2. **Run the ingestion once in CI** against the cloud Supabase project
   (`rag-ingest.yml` already does parse → chunk → embed → load via the
   service-role key). Confirm `chunk_embeddings` populated for the chosen model.
3. **Provision Supabase** — Free for hobby (accept the 7-day pause), Pro for a
   live game. pgvector and the 500 MB tier already cover the corpus.
4. **Provision Vercel** — Hobby for personal, Pro if commercial.
5. **Corpus stays in Git LFS** (53 MB ≪ 10 GB free). No need to move it to
   object storage unless it grows past the LFS quota.
6. **Secrets** — `SUPABASE_SERVICE_ROLE_KEY`, `RAG_EMBEDDING_URL` as CI secrets;
   `NEXT_PUBLIC_*` as Vercel env vars. No new privileged surface.

No application code needs to change to go fully cloud — only the embedding
endpoint's *hosting* and the env vars that point at it.

---

## Sources

- [Supabase pricing / free tier (UI Bakery breakdown, 2026)](https://uibakery.io/blog/supabase-pricing)
- [Supabase — Understanding Database and Disk Size (docs)](https://supabase.com/docs/guides/platform/database-size)
- [Vercel Hobby plan (docs)](https://vercel.com/docs/plans/hobby) · [Vercel pricing](https://vercel.com/pricing) · [Vercel limits](https://vercel.com/docs/limits)
- [GitHub — About billing for Git LFS (docs)](https://docs.github.com/billing/managing-billing-for-git-large-file-storage/about-billing-for-git-large-file-storage)
- [Hugging Face pricing](https://huggingface.co/pricing) · [HF Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing)
- [Ollama Cloud pricing](https://ollama.com/pricing) · [Ollama Cloud docs](https://docs.ollama.com/cloud)
- [Serverless GPU comparison — Modal vs RunPod vs Replicate (2026)](https://www.buildmvpfast.com/blog/scale-to-zero-serverless-gpu-modal-runpod-ai-hosting-2026)
- Repo: `docs/rag-ingestion.md`, `docs/rag-per-turn-budget.md`, `src/lib/ai/embeddings.ts`, `supabase/migrations/`, `.gitattributes`, corpus LFS pointers.
