/**
 * Numeric Range Filter Component
 */
import React from 'react';
import { Input } from '@/components/ui/input';

interface NumericRangeFilterProps {
    min?: number;
    max?: number;
    value?: {
        min?: number;
        max?: number;
    };
    onChange: (value: { min?: number; max?: number }) => void;
}

export const NumericRangeFilter: React.FC<NumericRangeFilterProps> = ({
    min,
    max,
    value = {},
    onChange
}) => {
    return (
        <div className="space-y-2">
            <Input
                type="number"
                value={value.min || ''}
                onChange={(e) => onChange({ ...value, min: parseFloat(e.target.value) })}
                placeholder={`Min ${min !== undefined ? `(${min})` : ''}`}
                className="text-sm"
                min={min}
                max={max}
            />
            <Input
                type="number"
                value={value.max || ''}
                onChange={(e) => onChange({ ...value, max: parseFloat(e.target.value) })}
                placeholder={`Max ${max !== undefined ? `(${max})` : ''}`}
                className="text-sm"
                min={min}
                max={max}
            />
        </div>
    );
};
