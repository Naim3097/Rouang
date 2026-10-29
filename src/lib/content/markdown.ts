import "server-only";
import { Marked, type Tokens } from "marked";

export type Heading = { id: string; text: string };

/** Site paths, in-page anchors, and web, email and phone links. */
const SAFE_HREF = /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Renders trusted, repository-authored Markdown to HTML on the server. No client JavaScript.
 * h2 headings get stable ids so articles can carry a table of contents.
 */
export function renderMarkdown(source: string): { html: string; headings: Heading[]; words: number } {
  const headings: Heading[] = [];
  const marked = new Marked({ gfm: true });

  marked.use({
    renderer: {
      heading(this: { parser: { parseInline(tokens: Tokens.Generic[]): string } }, token: Tokens.Heading) {
        const inner = this.parser.parseInline(token.tokens);
        const plain = token.text.replace(/[*_`]/g, "");
        const level = Math.min(Math.max(token.depth, 2), 4);
        if (level === 2) {
          const id = slugify(plain);
          headings.push({ id, text: plain });
          return `<h2 id="${id}">${inner}</h2>\n`;
        }
        return `<h${level}>${inner}</h${level}>\n`;
      },
      link(this: { parser: { parseInline(tokens: Tokens.Generic[]): string } }, token: Tokens.Link) {
        const inner = this.parser.parseInline(token.tokens);
        // A link that is not a page on this site or a web, email or phone address keeps its text only.
        if (!SAFE_HREF.test(token.href.trim())) return inner;
        const external = /^https?:\/\//i.test(token.href);
        const title = token.title ? ` title="${escapeAttr(token.title)}"` : "";
        const rel = external ? ` rel="noopener noreferrer"` : "";
        return `<a href="${escapeAttr(token.href.trim())}"${title}${rel}>${inner}</a>`;
      },
      // Raw HTML in a content file is shown as text, never injected into the page.
      html(token: Tokens.HTML | Tokens.Tag) {
        return escapeAttr(token.text);
      },
    },
  });

  const html = marked.parse(source, { async: false }) as string;
  const words = source.replace(/[#>*_`\-[\]()]/g, " ").split(/\s+/).filter(Boolean).length;
  return { html, headings, words };
}
