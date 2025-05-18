import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownPreview } from './markdown-preview';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const [tab, setTab] = useState('write');

  return (
    <Tabs value={tab} onValueChange={setTab} className={className}>
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          className="min-h-[250px]"
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="border rounded-md p-2 min-h-[250px] overflow-auto">
          <MarkdownPreview content={value} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
