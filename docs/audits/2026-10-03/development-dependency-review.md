# Undici dependency risk — read-only review

Recommendation: apply a narrow development-tool override `"miniflare": { "undici": "7.29.1" }`, retain all other pins, regenerate lock/inventory, and rerun installation, build/CI plus local Miniflare preview smoke. This is a supported upstream Undici patch release but a consumer-pin override, so compatibility remains conditional on those checks. Do not claim validation before executing them.

## Observed dependency boundary

GitHub Dependabot currently reports six open alerts for undici7.29.0, all development scope. Lock entry has dev:true. Installed Miniflare5.20260911.1-alpha pins undici7.29.0. No other direct package consumer found in lock. Miniflare's installed bundled source imports fetch/Request/Response/Headers and ordinary Pool; no BalancedPool, RetryHandler or explicit cache/retry/dump interceptor activation found. Its local runtime connection uses ordinary Pool and explicit local-dev TLS behavior; that is separate from the dropped-custom-validation BalancedPool bug.

Production dist/server/index.js contains only a compatibility comment mentioning Undici; no imported Undici package, BalancedPool, RetryHandler or interceptor implementation found. The affected NPM package is therefore not observed in the deployed application bundle. Cloudflare's platform fetch and Node's separately embedded fetch implementation are not the locked Miniflare Undici dependency and are outside this package-level finding. Static absence is a boundary assessment, not a claim that every platform library is vulnerability-free.

## Authoritative upstream findings

[Undici7.29.1 release](https://github.com/nodejs/undici/releases/tag/v7.29.1) documents security fixes for all six flagged advisories. The release is a patch in the same major line and remains compatible with Node24's version requirement. It also includes HTTP2 correctness/performance fixes, so a full toolchain smoke is warranted rather than assuming a security-only binary change.

- [TLS custom-validation loss](https://github.com/nodejs/undici/security/advisories/GHSA-w293-vg96-wgc3): requires BalancedPool and function-valued connect/tls configuration. Ordinary Pool/Client/Agent are explicitly unaffected. No such affected path observed in this app/installed Miniflare use.
- [Retry body orphaning](https://github.com/nodejs/undici/security/advisories/GHSA-pmjh-fq2x-6v4x) and [retry framing/splitting](https://github.com/nodejs/undici/security/advisories/GHSA-r53p-7pc4-xj5r): involve retry-enabled handling; explicit retry activation not observed.
- [Shared cached Set-Cookie disclosure](https://github.com/nodejs/undici/security/advisories/GHSA-2jfj-6hjv-fm6j) and [unsafe-method replay](https://github.com/nodejs/undici/security/advisories/GHSA-8436-99hf-9mmv): depend on cache-interceptor use; none observed.
- [Dump truncation](https://github.com/nodejs/undici/security/advisories/GHSA-2gqq-gqf2-x968): depends on dump interceptor; none observed.

## Merge decision

The existing vulnerable tool dependency is not evidence of exposed application TLS or a production exploit. Recording an existing dev-tool limitation is defensible if no change can be validated promptly. A narrow upstream patch override is preferable here: small scope, addresses real known tooling defects, avoids carrying six stale alerts, and fits the dependency/verification work already underway. Do not replace it with a broad dependency upgrade or skip the required revalidation.

No package changes, installation, bundle rebuild, production operation, dismissal or alert mutation performed by this review.
