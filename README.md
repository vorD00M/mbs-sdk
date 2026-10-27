# MBS SDK

Public data contracts for MBS Platform. This repository contains no private Go
Core, Authority implementation, signing keys, deployment credentials or content.

`schemas/` defines draft-2020-12 page, immutable release and license-envelope
formats. `src/` exposes TypeScript interfaces. `examples/` contains synthetic
fixtures only. `npm ci && npm test && npm run build` validates the initial package.

Schema validation is NOT license signature verification, membership authorization,
URL/path sanitization or module registry validation. Hosts must additionally
enforce unique region/block IDs, one semantic main region, 500 total blocks,
2 MiB body/depth limits, normalized paths, safe object keys, registered module
versions and each module's exact props schema. These semantic gates belong in
the private Core and release validator; the initial SDK does not claim them.

The package is marked private to prevent premature npm publication. Source
distribution/license terms and a public package release need owner approval.
The namespace and schema URLs are identifiers, not claims of deployed services.
