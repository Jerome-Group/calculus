# Own a bounded braces fork

Use the private `@jerome-group/calculus-braces` package in the `braces` dependency slot for issue #199. The fork retains braces 3.0.3 grammar and its complete callable and AST API. It rejects excessive parser depth and validates AST children, parent chains, and parent queue arrays before recursive operations. Each operation has fixed depth and visit limits. Options cannot raise them.

Replacing the glob engine changed symlink discovery, quoted roots, module selection, and evaluation order in the actual Next and dynamic-import consumers. A disclosed leaf fork preserves those contracts. Root-only exports prevent consumers from bypassing the guard through internal imports.

This extends the dependency licence policy in [ADR-0002](0002-publish-owned-learning-source-under-mit.md) and the vendor formatting treatment in [ADR-0003](0003-baseline-lint-debt-while-importing-existing-source.md). The original MIT notice remains in `vendor/braces/LICENSE`. `vendor/braces/UPSTREAM.json` records the exact upstream archive, source hashes, and commit.

## Consequences

Calculus maintainers own the complete fork, including unchanged upstream code. The root manifest and lock must include its source before installation and native Site publication. The original range and expansion options retain their semantics. This decision bounds recursive AST traversal, including arrays in detached parent queues. It does not promise unlimited expansion or classify Prettier's separate bundled implementation.

Behavior checks cover public API boundaries, ordinary stale parent links, hostile inputs in bounded subprocesses, actual Next root discovery, both dynamic-import distributions, and executed CommonJS module order.

## Revisit when

Retire the fork when a published upstream release bounds these recursive paths and passes the same grammar, API, clean-install, and actual-consumer checks. Remove the local dependency and override together.
