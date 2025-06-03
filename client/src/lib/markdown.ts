export function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '') // убираем изображения
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // убираем ссылки
    .replace(/[\*`_>#{}/+-]/g, '') // убираем символы markdown
    .replace(/\n+/g, ' ')
    .trim();
}

export function getExcerpt(md: string, maxLength: number): string {
  const text = stripMarkdown(md);
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

export function getMarkdownSnippet(md: string, maxLength: number): string {
  return md.length > maxLength ? md.slice(0, maxLength) + '...' : md;
}
