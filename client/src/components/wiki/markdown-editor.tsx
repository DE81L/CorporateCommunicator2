import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { markdownToHtml } from './markdown-utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'edit' | 'preview')} className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="edit">Edit</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <Textarea className="min-h-[250px]" value={value} onChange={(e) => onChange(e.target.value)} />
      </TabsContent>
      <TabsContent value="preview">
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }} />
      </TabsContent>
    </Tabs>
  );
}
