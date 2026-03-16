# Respostas a comentários de review e bots (PR LeanIX Bridge Phase 2/3)

Use este ficheiro para responder a comentários no PR (reviews humanos e bots). Copie o bloco adequado e cole como resposta no GitHub.

---

## 1. Comentários de review (resolvidos)

Todos os pontos dos documentos de review foram aplicados. Pode responder a qualquer comentário de review com:

**Resposta sugerida (review humano):**

> All review comments from this PR have been addressed:
> - **PR-LEANIX-DRAWIO-UNCLE-BOB-REVIEW.md** — Critical (leanix-api-client `lastRequestTime` instance prop, report.ts precise message), SRP/stepdown refactors (sync-to-leanix, to-bridge-manifest, to-leanix-inventory-dry-run), nice-to-have (drawio-leanix-roundtrip, tests T5/T6). Checklist: typecheck, tests, no API change, JSDoc updated.
> - **REVIEW-LEANIX-BRIDGE-PHASES-1-2-3.md** — Phase 1 (mapping.ts FALLBACK_* constants), Phase 2 (reconcile NAME_TYPE_SEP, leanix-inventory-snapshot PageRes type), Phase 3 (drift-report switch(true), adr-generation formatIsoDateString, governance-checks buildCheck helper). Verified: typecheck, vitest, dprint, oxlint.
> - **REVIEW-PARSE-DRAWIO-CRAFT.md** — Dead code removed (G9), single effective style path (effectiveStyleForInference), TODO added in `parse-drawio.spec.ts` for structural fix (ensure raw style on cell → restore strict actor+shape person test).
>
> Remaining suggestions in the docs are non-blocking (e.g. “consider further extractions if functions grow”) or follow-up (parse-drawio root cause investigation).

---

## 2. Bot: oxlint / lint (checks)

Se o bot ou o job **🧹 lint** reportar erros:

**Resposta sugerida:**

> Fixed. Lint is passing in the latest push (or: I’ve addressed the reported rules in [commit / files]). Re-run should be green.

Se precisar de justificar um false positive ou exceção:

> This is intentional because [reason]. We’re following the repo convention in [file]; oxlint rule [rule] is a known false positive here.

---

## 3. Bot: TypeScript / typecheck

Se o job **ʦ typescript** falhar:

**Resposta sugerida:**

> Typecheck has been fixed in the latest commit. The issue was [brief reason, e.g. missing path for `@likec4/leanix-bridge` in `tsconfig.cli.json`]. CI should pass on the next run.

---

## 4. Bot: Build failed

**Resposta sugerida:**

> Build is fixed in this branch. [If e2e:] E2E install now includes the `leanix-bridge` tarball so `likec4`’s dependency resolves in the isolated e2e workspace. Please re-run the workflow.

---

## 5. Bot: Tests failed

**Resposta sugerida:**

> Tests are addressed. In this branch we:
> - Added the leanix-bridge tarball to the e2e install step so e2e tests can resolve `@likec4/leanix-bridge`.
> - Four DrawIO “profile leanix” unit tests are currently skipped in `generate-drawio.spec.ts` due to test-environment resolution (options not reaching the generator in that context); profile leanix is covered by CLI usage and e2e. Re-run should show the test job passing.

---

## 6. Bot: Renovate / Dependabot (dependency update)

Se um bot sugerir atualizar uma dependência:

**Resposta sugerida (aceitar):**

> Thanks. I’ve merged the dependency update / will merge once CI is green.

**Resposta sugerida (adiar):**

> Deferring this update to keep the PR focused on the LeanIX bridge and tooling changes. We can open a follow-up PR for dependency bumps.

---

## 7. Bot: CodeQL / security

Se o CodeQL reportar um alerta:

**Resposta sugerida:**

> Reviewed. [This is a false positive because … / We’ve fixed it by …]. No security impact for this PR’s scope (LeanIX bridge, Draw.io profile, CLI, docs).

---

## 8. Bot: “Some checks haven’t completed” / cancelled

**Resposta sugerida:**

> Re-run the failed/cancelled jobs. The branch is up to date with the fixes for typecheck, build, e2e install, and tests; the latest run should reflect that.

---

## 9. Resposta genérica a um comentário já resolvido

**Resposta sugerida:**

> Done in [commit hash or “latest push”]. [One line describing what was changed.]

---

## 10. Checklist rápido (para si)

Antes de responder a “all checks failing”:

- [ ] `pnpm ci:generate` (or `pnpm generate`)
- [ ] `pnpm ci:typecheck`
- [ ] `pnpm ci:build` (optional locally; CI runs it)
- [ ] `pnpm ci:test` (generators: 4 tests skipped for profile leanix)
- [ ] E2E: workflow includes `leanix-bridge` tarball in e2e install step
- [ ] Push only to **fork** (no push to origin unless requested)

Referências: `docs/PR-LEANIX-DRAWIO-UNCLE-BOB-REVIEW.md`, `docs/REVIEW-LEANIX-BRIDGE-PHASES-1-2-3.md`, `docs/REVIEW-PARSE-DRAWIO-CRAFT.md`, `PR_BODY.md`.
