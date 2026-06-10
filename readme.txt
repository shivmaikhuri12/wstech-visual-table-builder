=== WSTech Visual Table Builder ===
Contributors: shivmaikhuri
Donate link: https://wstech.in/donate
Tags: table, gutenberg, table-builder, responsive-table, shortcode
Requires at least: 6.2
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 2.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A professional WordPress table builder with drag-and-drop editing, merge cells, templates, CSV/JSON import, shortcodes, and reusable table management.

== Description ==

**WSTech Visual Table Builder** is a powerful Gutenberg block plugin that brings MS Word/Excel-style table creation directly into WordPress — no coding required. Create reusable tables, manage them centrally, and embed them anywhere via shortcodes.

= ✨ Key Features =

**Reusable Table Management**
* Dedicated "WSTech Tables" admin screen — create, edit, duplicate, delete
* Each table gets a unique shortcode: `[wstech_table id="123"]`
* Embed tables in Gutenberg, Elementor, Divi, Beaver Builder, Classic Editor, or PHP templates
* Slug-based shortcodes supported: `[wstech_table slug="pricing-table"]`
* WordPress revisions for table version history

**Editor Experience**
* Click-to-edit cells with full rich text (bold, italic, underline, strikethrough, links)
* Per-cell formatting: background colour, text colour, alignment, vertical align, padding
* Tab/Shift+Tab keyboard navigation — auto-adds rows at the end
* Right-click context menu for quick row/column operations
* Drag & drop row and column reordering
* Undo / Redo via WordPress native history (Ctrl+Z / Ctrl+Y)

**Table Structure**
* Header row (thead), footer row (tfoot), first-column headers
* Merge cells (colspan + rowspan) — Shift+click to multi-select, then merge
* Unmerge any merged cell with one click
* Duplicate rows and columns
* Insert/delete rows and columns (above/below/before/after)
* Optional table caption

**10 Built-in Templates**
* Blank 4×4, Employee Directory, Pricing Table, Product Comparison
* Invoice/Bill, Class Timetable, Sports Standings, Project Tracker
* Budget Tracker, Nutrition Facts

**6 Premium Themes**
* Default (Indigo), Striped (Sky Blue), Bordered (Slate), Dark, Minimal, Colorful

**Data Import / Export**
* Export CSV (always available in editor)
* Export JSON (.vtb.json) — full table backup including styles and settings
* Import CSV — file upload or paste, auto-detects delimiter
* Import JSON — restore a previously exported .vtb.json
* Frontend CSV Export button (opt-in per table)

**Frontend Interactivity (instant, no page reloads)**
* Column sorting (ASC/DESC, numeric + date-aware)
* Live search / row filter
* Pagination with configurable page size
* Hover row highlight

**Responsive Design**
* Horizontal scroll mode (default)
* Stack on Mobile mode — each row becomes a vertical card with column labels

**Universal Compatibility**
* Gutenberg Block Editor (native)
* Elementor (Shortcode Widget)
* Divi (Code Module)
* Beaver Builder
* Classic Editor
* PHP templates: `<?php echo do_shortcode('[wstech_table id="123"]'); ?>`

**Privacy / External Services**
* The plugin does not send table data to external services.
* Links to the plugin website and donation page are ordinary admin/readme links only.

**Source Code and Build**
* Public source repository: https://github.com/shivmaikhuri12/wstech-visual-table-builder
* Editable block source files are in the `src/` directory.
* Compiled block assets are generated into the `build/` directory by `@wordpress/scripts`.
* Build tools and development dependencies are declared in `package.json`.
* To rebuild the production assets from source, run:

    npm install
    npm run build

**Uninstall**
* Uninstalling the plugin through WordPress removes WSTech Tables created by the plugin and their associated post meta.

= 🔧 How to Use =

**Method 1: Reusable Tables (Recommended)**
1. Go to **WSTech Tables → Add New** in the admin
2. Name your table and design it using the visual editor
3. Click **Publish**
4. Copy the shortcode from the sidebar: `[wstech_table id="123"]`
5. Paste the shortcode anywhere — pages, posts, Elementor, Divi, etc.

**Method 2: Inline Tables (Quick)**
1. In any post/page, click **+ Add Block** and search for "Visual Table Builder"
2. Design your table directly in the post
3. Save the post — your table is live!

== Installation ==

1. Upload the `wstech-visual-table-builder` folder to `/wp-content/plugins/`
2. Activate the plugin through the **Plugins** menu
3. Go to **WSTech Tables → Add New** to create your first reusable table
4. Or add the **Visual Table Builder** block directly in any post/page

== Frequently Asked Questions ==

= How do I embed a table in Elementor? =
Create a table in WSTech Tables → Add New, publish it, copy the shortcode, then paste it into an **Elementor Shortcode Widget**.

= Can I use the same table on multiple pages? =
Yes! Create the table once in WSTech Tables, then paste the same shortcode on as many pages as you want. Editing the table updates it everywhere.

= Does it work with Classic Editor? =
Yes. Use the shortcode `[wstech_table id="123"]` in the Classic Editor text area.

= Can I import data from Excel? =
Yes. Export your Excel data as CSV, then use the **Import CSV** button in the block toolbar.

= How does sorting work? =
When you enable **Sortable Columns** in the sidebar, visitors can click any column header to sort. Sorting is numeric-aware and works entirely client-side.

= Can I merge cells? =
Yes. Shift+click to select a rectangular range, then click **Merge Cells** in the format bar.

= Where is the source code for the compiled block assets? =
The public source repository is https://github.com/shivmaikhuri12/wstech-visual-table-builder. Editable files are in `src/`, compiled files are in `build/`, and the production build can be regenerated with `npm install` followed by `npm run build`.

== Screenshots ==

1. The Visual Table Builder block in the Gutenberg editor
2. WSTech Tables admin management screen
3. Template picker with 10 built-in templates
4. CSV/JSON Import modal
5. Frontend table with sorting, search, pagination
6. Shortcode embedding in Elementor

== Changelog ==

= 2.0.0 =
* NEW: Reusable Table Management via Custom Post Type
* NEW: Shortcode support `[wstech_table id="123"]` and `[wstech_table slug="name"]`
* NEW: WSTech Tables admin screen (list, create, edit, duplicate, delete)
* NEW: Shared PHP rendering engine (server-side rendering)
* NEW: Dynamic block rendering via render_callback
* NEW: WordPress revisions support for table version history
* NEW: Sidebar meta box with copy-to-clipboard shortcode
* NEW: Plugin action links (Manage Tables, Add New)
* NEW: Elementor / Divi / Classic Editor support via shortcodes
* NEW: Merge cells (Shift+click multi-select + colspan/rowspan)
* NEW: Drag & Drop row and column reordering
* NEW: 10 built-in templates with animated modal picker
* NEW: CSV Import, JSON Import/Export
* NEW: Duplicate Row/Column
* NEW: Undo / Redo toolbar buttons
* NEW: Right-click context menu
* IMPROVED: Responsive Stack mode with column labels on mobile
* IMPROVED: Future-proof cell data model with meta field

= 1.0.0 =
* Initial release
* Gutenberg block with WYSIWYG cell editing
* 6 premium themes, cell formatting, sorting, search, pagination
* CSV export, responsive modes

== Upgrade Notice ==

= 2.0.0 =
Major release. Adds reusable tables, shortcodes, admin management, and universal builder compatibility.

== Developer Notes ==

**Data Model:** Tables are stored as JSON in post meta (`_wstech_table_data`) with a `version` field for future migration support.

**Rendering:** A shared PHP renderer (`WSTech_Table_Renderer`) generates frontend HTML for both Gutenberg blocks (via `render_callback`) and shortcodes.

**Block Name:** The Gutenberg block namespace is `vtb/table-builder` (stable, will not change).

**Building from source:**
```
cd wp-content/plugins/wstech-visual-table-builder
npm install
npm run build
```
