import { markdownToHtml } from './markdown-utils';

export default function MarkdownViewer({ content }: { content: string }) {
  return (
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
  );
}
