import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea, type TextareaProps } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownPreview } from './markdown-preview';

interface MarkdownEditorProps
  extends Omit<TextareaProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const MarkdownEditor = forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [tab, setTab] = useState('write');
    const { t } = useTranslation();

    return (
      <Tabs value={tab} onValueChange={setTab} className={className}>
        <TabsList>
          <TabsTrigger value="write">{t('common.write', 'Write')}</TabsTrigger>
          <TabsTrigger value="preview">{t('common.preview', 'Preview')}</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          <Textarea
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="min-h-[250px]"
            {...props}
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="border rounded-md p-2 min-h-[250px] overflow-auto">
            <MarkdownPreview content={value} />
          </div>
        </TabsContent>
      </Tabs>
    );
  },
);
MarkdownEditor.displayName = 'MarkdownEditor';
