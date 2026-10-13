#!/usr/bin/env python3
"""
Build a new PDF of the rolled characters (docs/pregen list 1e.txt), one per page,
each topped with the matching Elmore portrait extracted from
docs/Pre-Gen_Characters_Vol_1.pdf.

Portraits are matched to rolled characters by order (both lists hold the same 16
characters in the same sequence); a token check warns on any mismatch.
"""

import os
import re
import sys
import unicodedata
import fitz  # PyMuPDF

HERE = os.path.dirname(os.path.abspath(__file__))
SRC_PDF = os.path.join(HERE, "docs", "Pre-Gen_Characters_Vol_1.pdf")
ROLLED = os.path.join(HERE, "docs", "pregen list 1e.txt")
OUT_PDF = os.path.join(HERE, "docs", "pregen_sheets_with_portraits.pdf")

# Character sheet pages in the source PDF are 0-based indices 4..19 (16 pages),
# in the same order as the rolled list.
FIRST_CHAR_PAGE = 4
NUM_CHARS = 16


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))


def norm(s):
    return re.sub(r"[^a-z0-9]", "", strip_accents(s).lower())


def parse_rolled(path):
    """Split the rolled text file into (name, body) blocks, in order."""
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()

    lines = text.splitlines()
    # indices where a new character begins
    starts = [i for i, ln in enumerate(lines) if re.match(r"\s*Name:\s", ln)]
    blocks = []
    for k, start in enumerate(starts):
        end = starts[k + 1] if k + 1 < len(starts) else len(lines)
        block = lines[start:end]
        # drop trailing inter-character separators / blank lines
        while block and re.match(r"^[_\s]*$", block[-1]):
            block.pop()
        name_line = block[0]
        name = name_line.split("Name:", 1)[1].strip()
        # normalise interior whitespace in the body: keep as-is
        body = "\n".join(ln.rstrip() for ln in block)
        blocks.append((name, body))
    return blocks


def extract_portraits(doc):
    """Return list of (xref_imagebytes, ext, w, h) for each character page in order."""
    portraits = []
    for idx in range(FIRST_CHAR_PAGE, FIRST_CHAR_PAGE + NUM_CHARS):
        page = doc[idx]
        imgs = page.get_images(full=True)
        if not imgs:
            portraits.append(None)
            continue
        xref = imgs[0][0]
        info = doc.extract_image(xref)
        portraits.append(info)  # dict with image/ext/width/height
    return portraits


def page_text_norm(doc, idx):
    return norm(doc[idx].get_text("text"))


def main():
    doc = fitz.open(SRC_PDF)
    blocks = parse_rolled(ROLLED)
    if len(blocks) != NUM_CHARS:
        print(f"WARNING: expected {NUM_CHARS} rolled characters, found {len(blocks)}")

    portraits = extract_portraits(doc)

    # Sanity: verify the portrait page seems to match the rolled character.
    for i, (name, _) in enumerate(blocks):
        pdf_idx = FIRST_CHAR_PAGE + i
        token = norm(name.split()[0])
        # pick a more distinctive token for tricky names
        distinctive = {
            "the": norm("Lorella"),
        }.get(token, token)
        if distinctive not in page_text_norm(doc, pdf_idx):
            # try last word too
            last = norm(name.split()[-1])
            ok = last in page_text_norm(doc, pdf_idx)
            print(f"  note: '{name}' token check soft-miss on page {pdf_idx+1} "
                  f"(last-word match={ok})")

    # Build the output PDF.
    out = fitz.open()
    PAGE_W, PAGE_H = fitz.paper_size("letter")  # 612 x 792
    M = 28  # margin
    usable_w = PAGE_W - 2 * M

    for i, (name, body) in enumerate(blocks):
        page = out.new_page(width=PAGE_W, height=PAGE_H)

        # --- Title ---
        title_y = M + 14
        page.insert_text((M, title_y), name, fontname="helv", fontsize=16)

        # --- Portrait (centered header) ---
        info = portraits[i]
        port_top = title_y + 8
        port_h = 180.0
        if info:
            iw, ih = info["width"], info["height"]
            aspect = iw / ih if ih else 1.0
            port_w = port_h * aspect
            port_w = min(port_w, 230.0)
            # recompute height if width was capped
            port_h2 = port_w / aspect if aspect else port_h
            x0 = (PAGE_W - port_w) / 2.0
            rect = fitz.Rect(x0, port_top, x0 + port_w, port_top + port_h2)
            page.insert_image(rect, stream=info["image"], keep_proportion=True)
            text_top = port_top + port_h2 + 14
        else:
            text_top = port_top

        # --- Monospaced sheet body, auto-sized to fit width & height ---
        body_lines = body.split("\n")
        n_lines = len(body_lines)
        max_len = max((len(ln) for ln in body_lines), default=1)

        avail_h = PAGE_H - M - text_top
        # Courier metrics: char width ~0.6*fs, line height ~1.18*fs
        fs_w = usable_w / (0.6 * max(max_len, 1))
        fs_h = avail_h / (1.18 * max(n_lines, 1))
        fs = min(fs_w, fs_h, 8.5)
        fs = max(fs, 4.0)
        leading = 1.18 * fs

        y = text_top + fs
        for ln in body_lines:
            page.insert_text((M, y), ln, fontname="cour", fontsize=fs)
            y += leading

    out.save(OUT_PDF, deflate=True)
    out.close()
    doc.close()
    print(f"wrote {len(blocks)} character pages to {OUT_PDF}")


if __name__ == "__main__":
    sys.exit(main())
