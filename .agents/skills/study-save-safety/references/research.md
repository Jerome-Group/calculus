# Why use TLC for this queue

Research checked on 2026-10-23. The [upstream create-formal-verification-skill](https://github.com/cursor/plugins/blob/main/pstack/skills/create-formal-verification-skill/SKILL.md) selects high-harm promises, requires a correspondence to actual atomic code steps, preserves genuine failures, and asks for real-code mutation controls and upkeep. It recommends TLA+ for scheduling and state-machine questions. The installed pstack 0.9.101 skill supplies the Codex location and tool mapping used here.

The [mirrored 21 October statechart post](https://twiscan.com/en/x/poteto/2113398433977659654), also visible in [the mirrored account feed](https://twiscan.com/en/x/poteto), suggests using a statechart with the formal-verification skill to expose user-visible flow bugs. This is mirrored text. The coordinator reported direct X URLs returned HTTP 403. The upstream skill is the primary workflow source. This queue check uses neither an X image nor a statechart as evidence that the implementation is correct.

[Official TLC documentation](https://docs.tlapl.us/using:tlc:start) describes an explicit-state checker for finite TLA+ systems, its Java requirement, command-line configuration, and JSON counterexample export. A finite queue model can enumerate response ordering, failure, retry, and another writer without sampling. Separating account reads keeps the checked graphs small. That is why TLC fits this question. It does not verify TypeScript execution directly.

The binary comes from the [official TLA+ v1.8.0 release](https://github.com/tlaplus/tlaplus/releases/tag/v1.8.0), pinned by SHA-256 in `scripts/toolchain.json`. The recorded jar reports `TLC2 Version 2026.10.23.035525`, revision `606dfa4`. The pin identifies the bytes, including if an upstream release asset changes later. This note makes no latest-stable claim.

[Adoptium archive instructions](https://adoptium.net/installation/archives/) document local extraction and checksum verification. The harness pins Eclipse Temurin JRE 21.0.9+10 and four platform archives from the [official release](https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21.0.9%2B10). Bootstrap checks the archive digest before extraction and checks Java's reported version. It does not change the machine's Java configuration.

The result combines an exhaustive finite-model check, selected real-code schedules, exact queue counterexample replays, and source mutation controls. These are distinct evidence. There is no full implementation refinement proof and no claim about native sign-in or learning gains.

The recorded run used macOS arm64 and Node.js 26.10.0. The other pinned platform archives were not executed during this run.
