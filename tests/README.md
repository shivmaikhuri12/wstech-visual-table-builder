# B1 data integrity regression tests

## B4 merged-cell integrity tests

Run `npm run test:b4`: 44 targeted tests with the existing Jest runtime. Fixtures cover horizontal, vertical, 2D, independent and boundary merges; all eight structural operations; malformed-grid rejection; merge/unmerge and content retention. Operations touching a merged row/column, inserting inside a span, or moving across a merged region require unmerging first. Outside operations remain available. The editor also rejects candidates and section settings that would make a span cross header/body/footer. This is a conservative maintenance guard, not automatic span repair. Chrome results are in workspace-root `TASK-B4-REPORT.md`.

## B3 frontend state regression tests

Run `npm run test:b3`. The 19 focused Jest/jsdom tests exercise the real frontend DOM handlers using the existing @wordpress/scripts runtime. Coverage includes text/integer/decimal/currency/strict ISO calendar-date sorting, blanks, mixed types, stable ties, active sort during search/clear, pagination/reset/empty results, independent tables, Enter/Space/aria-sort and repeat initialization. Chrome acceptance is recorded in the workspace-root `TASK-B3-REPORT.md`.

Only valid `YYYY-MM-DD` calendar dates are recognized as dates. Invalid or ambiguous dates remain text. Numeric values must match fully after existing currency/comma/percent/whitespace cleanup. Ascending mixed-type rank is date, number, text; descending reverses those ranks. Blanks stay last and ties retain original row order in both directions. Merged body cells are deferred to B4.

## B2 import/export regression tests

Run `npm run test:b2` after installing the repository's existing development dependencies. This uses the Jest/React test runtime already supplied by @wordpress/scripts; no new test dependency was installed. Tests exercise real parsers, shared export policy, both CSV download paths and the import modal handlers. Tests mock only visual WordPress controls and file/download browser APIs.

Manual sample files are in `tests/fixtures/b2`. The owner Chrome checklist and acceptance status are in the workspace-root TASK-B2-MANUAL-ACCEPTANCE.md and TASK-B2-REPORT.md. Automated tests do not replace that browser/spreadsheet acceptance gate.

No extra test framework is required. Use PHP CLI with mysqli and a **disposable local WordPress database**, with this checkout deployed and activated. These tests create synthetic published/draft tables and revisions and leave them for inspection. Never run on production. No automatic deletion is performed.

PowerShell (substitute your PHP executable and WordPress path):

```powershell
$env:WSTB_TEST_DISPOSABLE = '1'
$env:WSTB_TEST_WP_LOAD = 'C:\path\to\disposable\wordpress\wp-load.php'
$env:WSTB_TEST_USER_ID = '1' # test administrator
php tests/data-integrity.php
php tests/data-integrity.php duplicate
```

Both commands must return exit code 0. Add `-c path/to/php.ini` if the CLI needs a specific configuration.

Coverage: omitted/false/true header attributes versus registered schema defaults and inline/shortcode output; six representative quote/backslash/JSON/Unicode/apostrophe values across two save/reload cycles; WordPress revision restoration; representative 2.1.0 structured data; and the real nonce-protected duplication handler (run separately because it exits after redirect). Duplication checks content, metadata, single derived metadata value and resave.

These are WordPress integration tests, not mocked metadata tests. The fixtures intentionally omit static saved block markup, so they are suitable for server persistence/rendering checks, not Gutenberg visual acceptance. Browser create/save/reopen testing remains a separate release gate. Tests do not certify full WordPress compatibility.
