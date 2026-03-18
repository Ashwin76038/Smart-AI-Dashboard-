/**
 * Filter Panel Component
 */
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { CategoryFilter } from '@/components/filters/CategoryFilter';
import { NumericRangeFilter } from '@/components/filters/NumericRangeFilter';

interface FilterConfig {
    type: 'dateRange' | 'multiSelect' | 'numericRange' | 'textContains';
    field: string;
    label: string;
    options?: string[];
    default?: any;
    min?: number;
    max?: number;
}

interface FilterPanelProps {
    filters: FilterConfig[];
    activeFilters: any;
    onChange: (filters: any) => void;
    className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
    filters = [],
    activeFilters = {},
    onChange,
    className = ''
}) => {
    const handleFilterChange = (field: string, value: any) => {
        const newFilters = {
            ...activeFilters,
            [field]: {
                field,
                type: filters.find(f => f.field === field)?.type,
                ...value
            }
        };
        onChange(newFilters);
    };

    const handleClearFilter = (field: string) => {
        const newFilters = { ...activeFilters };
        delete newFilters[field];
        onChange(newFilters);
    };

    const handleClearAll = () => {
        onChange({});
    };

    const activeCount = Object.keys(activeFilters).length;

    return (
        <Card className={`p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                    {activeCount > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                            {activeCount}
                        </span>
                    )}
                </div>
                {activeCount > 0 && (
                    <Button
                        onClick={handleClearAll}
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                    >
                        Clear all
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {filters.map((filter, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                {filter.label}
                            </label>
                            {activeFilters[filter.field] && (
                                <button
                                    onClick={() => handleClearFilter(filter.field)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {filter.type === 'dateRange' && (
                            <DateRangeFilter
                                value={activeFilters[filter.field]}
                                onChange={(value) => handleFilterChange(filter.field, value)}
                            />
                        )}

                        {filter.type === 'multiSelect' && (
                            <CategoryFilter
                                options={filter.options || []}
                                value={activeFilters[filter.field]?.values || []}
                                onChange={(values) => handleFilterChange(filter.field, { values })}
                            />
                        )}

                        {filter.type === 'numericRange' && (
                            <NumericRangeFilter
                                min={filter.min}
                                max={filter.max}
                                value={activeFilters[filter.field]}
                                onChange={(value) => handleFilterChange(filter.field, value)}
                            />
                        )}
                    </div>
                ))}

                {filters.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No filters available
                    </p>
                )}
            </div>
        </Card>
    );
};
