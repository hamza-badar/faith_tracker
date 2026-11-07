import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DateSortToggle({ dateSortDesc, onToggle }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-7 px-2 rounded-lg text-muted-foreground hover:text-foreground"
      aria-label={dateSortDesc ? 'Show oldest dates first' : 'Show newest dates first'}
      title={dateSortDesc ? 'Newest first — click for oldest first' : 'Oldest first — click for newest first'}
    >
      {dateSortDesc ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
    </Button>
  );
}
