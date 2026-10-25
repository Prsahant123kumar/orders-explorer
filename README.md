# Orders Explorer

A single-screen tool for exploring about 50,000 orders. It has a hand-built virtualized data grid and a hand-built filter builder, both driven by one state that lives in the URL. React, TypeScript, Vite.

## 1. How to run

Requires Node 24 and npm.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other commands:

```bash
npm run build           # type check + production build
npm run preview         # serve the production build
npm run lint            # oxlint
npm run check:data      # data cleaning rules, run on the real file
npm run check:filters   # filter engine compared with plain loops
npm run check:url       # URL round trip and broken URLs
npm run check:csv       # CSV escaping and row counts
npm run bench           # timings on 50,000 rows
```

## 2. Screenshots

Main screen: filters, chips, sort, selection and the details panel.

![Main screen](docs/screenshots/main.png)

Empty state: the filter matches nothing.

![Empty state](docs/screenshots/empty.png)

## 3. Dependencies

Runtime:

- `react`: UI library.
- `react-dom`: renders React in the browser.

Dev only: `typescript`, `vite`, `@vitejs/plugin-react`, `oxlint`, the `@types/*` packages (all from the Vite template) and `tsx` (runs the check scripts in Node).

No table, grid, virtualization, query-builder, router or state library is used.

## 4. Data loading

- `orders.json` is in `public/` and fetched at runtime. Importing 17 MB of JSON would bloat the JS bundle and block the main thread.
- Parsing, cleaning (all 10 rules in `docs/data-notes.md`) and de-duplication run in a **Web Worker**, so the page stays responsive and shows a loading state.
- All cleaning lives in `src/data/normalize.ts` and `src/data/dedupe.ts`. No cell or filter code fixes data.
- 50,030 records become 50,000 unique orders. In Node: parse about 85 ms, clean and de-duplicate about 80 ms.
- Orders are held as plain objects in memory. Sorting and filtering work on the whole list, and the grid only renders the rows on screen.

## 5. The 200 rows question

**The export contains all 200 selected rows**, including the 180 hidden by the filter.

- Selecting rows is a deliberate act. A filter only changes the view, so it should not silently throw that work away.
- The screen always matches the file. The top bar says `200 selected (180 hidden by filter)` and the button says `Export 200 rows`.
- For the other behaviour there is a **Deselect hidden** button. One click makes the selection, the count and the export equal to what is visible.
- Rows in the CSV follow the current sort order.

## 6. Design changes

- Filter conditions are rows with a field dropdown, an operator dropdown and an input that fits the field type. The sketch showed them as small pills, which cannot hold a date range or a multi-value picker.
- There is no checkbox column. Click, Shift+click, Ctrl+click and Space select rows, which is faster for keyboard users and keeps the grid dense.
- The grid has 13 columns (the sketch showed 7), so it scrolls sideways, and any column can be pinned from its header.
- Added after sketching: a pin button on each header, a "Deselect hidden" button for the 200 rows case, and a yellow banner for invalid URLs.
- Amounts are shown with the rupee sign in Indian format, and dates as `YYYY-MM-DD HH:mm` in UTC, instead of "Rs" and "14 Mar 2025".
- The empty state covers the grid body and keeps the header row visible, so column widths and pinning survive clearing the filter.

## 7. Known issues

- The selection is stored in the URL as ID ranges. Contiguous rows stay short, but thousands of scattered rows make a very long URL.
- Text sorting compares characters, so `Customer 10` sorts before `Customer 2`. This was chosen for speed. Sorting by ID is not affected.
- All dates are shown and filtered in UTC, not local time.
- No order in the data is above about 3,640 INR, so an amount filter above that gives the empty state.
- A date filter on "Updated" hides orders with no update date, because they have nothing to compare.
- Column widths, the open details panel and the focused cell are not stored in the URL. Only filter, sort, pinned column and selection are.
- The URL is updated with `replaceState`, so the Back button does not step through filter changes.
- The pin button on a header only appears on hover or keyboard focus.
- There is no column reordering and there are no saved views.
- The layout is designed for laptop screens (13 inch and up), not phones.
- There is no unit test framework. Correctness is checked by the `check:*` scripts, which run against the real data.
- Tested manually in one Chromium-based browser on Windows. Firefox and Safari were not tested.

## Features

- **Grid:** virtualized scrolling (about 26 rows in the DOM for 50,000), sticky header, type-aware sorting (empty values always last), column resize (double-click to reset), one pinned column, multi-select, details panel, right-aligned numbers, long text cut with a tooltip and the full text in the details panel.
- **Filters:** field, operator and value conditions. Text: contains, does not contain, equals. Number: equals, greater than, less than, between. Date: before, after, between. Fixed values (status, region, channel, payment, priority) are multi-pick, and priority has a `None` option. Conditions inside a group are combined with OR, and groups with AND. Removable chips, Clear all, and a live count such as `1,284 of 50,000 orders`.
- **URL:** `f` (filter), `sort`, `pin` and `sel` (selected rows as ranges, for example `sel=1234-1240,2001`). Invalid parts are ignored one by one, a banner explains what was wrong, and the app falls back to the default for that part.
- **Notes** are always rendered as plain text, never as HTML.
- **Export:** CSV with proper escaping, a UTF-8 BOM for Excel, and a guard against spreadsheet formula injection in text cells.

## Keyboard

| Key | Action |
|---|---|
| Arrow keys | Move the focused cell |
| PageUp / PageDown | Move by one screen |
| Home / End | First / last column |
| Ctrl+Home / Ctrl+End | First / last cell |
| Space | Select or unselect the focused row |
| Enter | Open the details panel |
| Esc | Close the details panel |
| Enter or Space on a header | Sort by that column |

## Performance (Node, 50,000 rows)

- Filters take 1 to 6 ms and sorts take 6 to 45 ms.
- Orders are sorted once when the sort changes, and then filtered, so changing a filter never re-sorts.
- Filter changes go through `useDeferredValue`, and rows are memoized, so selection and focus changes only re-render the rows that changed.

## Structure

```
src/data        loading, cleaning, de-duplication, worker
src/grid        grid, virtualization, sorting, columns, rows
src/filters     filter model, engine, builder UI, chips
src/url         URL encoding, validation, syncing
src/export      CSV
src/components  details panel, empty state, error banner
scripts         check and benchmark scripts
design          sketches
docs            data notes and screenshots
```