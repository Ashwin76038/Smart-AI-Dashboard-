/**
 * Date Range Filter Component
 */
import React from 'react';
import { Input } from '@/components/ui/input';

interface DateRangeFilterProps {
    value?: {
        start?: string;
        end?: string;
    };
    onChange: (value: { start?: string; end?: string }) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    value = {},
    onChange
}) => {
    return (
        <div className="space-y-2">
            <Input
                type="date"
                value={value.start || ''}
                onChange={(e) => onChange({ ...value, start: e.target.value })}
                className="text-sm"
                placeholder="Start date"
            />
            <Input
                type="date"
                value={value.end || ''}
                onChange={(e) => onChange({ ...value, end: e.target.value })}
                className="text-sm"
                placeholder="End date"
            />
        </div>
    );
};
