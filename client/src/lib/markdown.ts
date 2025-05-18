export function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove links
    .replace(/[\*`_>#{}/+-]/g, '') // remove markdown syntax chars
    .replace(/\n+/g, ' ')
    .trim();
}

export function getExcerpt(md: string, maxLength: number): string {
  const text = stripMarkdown(md);
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}
