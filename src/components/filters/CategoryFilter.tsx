/**
 * Category Multi-Select Filter Component
 */
import React from 'react';

interface CategoryFilterProps {
    options: string[];
    value: string[];
    onChange: (values: string[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
    options,
    value = [],
    onChange
}) => {
    const handleToggle = (option: string) => {
        const newValue = value.includes(option)
            ? value.filter(v => v !== option)
            : [...value, option];
        onChange(newValue);
    };

    return (
        <div className="space-y-2 max-h-48 overflow-y-auto">
            {options.map((option) => (
                <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                    <input
                        type="checkbox"
                        checked={value.includes(option)}
                        onChange={() => handleToggle(option)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                </label>
            ))}
        </div>
    );
};
