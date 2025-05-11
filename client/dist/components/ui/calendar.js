import { jsx as _jsx } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
export function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
    return (_jsx(DayPicker, { showOutsideDays: showOutsideDays, className: cn('p-3', className), classNames: classNames, components: {
            Chevron: ({ orientation }) => orientation === 'left' ? (_jsx(ChevronLeft, { className: "h-4 w-4" })) : (_jsx(ChevronRight, { className: "h-4 w-4" })),
        }, ...props }));
}
Calendar.displayName = 'Calendar';
