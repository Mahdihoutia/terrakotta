/**
 * Conversion Markdown minimaliste des articles (titres, liens, gras, italique,
 * paragraphes). À exécuter côté serveur : le HTML est transmis au client.
 */
export function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-[#2C1810] mt-10 mb-4">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-display text-2xl md:text-3xl font-light text-[#2C1810] mt-12 mb-5">$1</h2>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-[#2563EB] underline underline-offset-2 hover:text-[#1D4ED8] transition-colors">$1</a>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .split(/\n\n+/)
    .map((block) => {
      if (block.startsWith("<h2") || block.startsWith("<h3") || block.trim() === "") {
        return block;
      }
      return `<p class="text-[1rem] leading-[1.85] text-[#4A3F35] mb-6">${block.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");
}
