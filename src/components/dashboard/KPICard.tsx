/**
 * KPI Card Component
 */
import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
    label: string;
    value: string | number;
    format?: string;
    comparison?: {
        value: number;
        period: string;
    };
    className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
    label,
    value,
    format = 'number',
    comparison,
    className = ''
}) => {
    const formatValue = (val: string | number) => {
        if (typeof val === 'number') {
            switch (format) {
                case 'currency':
                    return `$${val.toLocaleString()}`;
                case 'percentage':
                    return `${val.toFixed(1)}%`;
                default:
                    return val.toLocaleString();
            }
        }
        return val;
    };

    const isPositive = comparison && comparison.value > 0;
    const isNegative = comparison && comparison.value < 0;

    return (
        <Card className={`p-6 ${className}`}>
            <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-3xl font-bold text-gray-900">
                    {formatValue(value)}
                </p>
                {comparison && (
                    <div className="flex items-center gap-1 text-sm">
                        {isPositive && (
                            <>
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 font-medium">
                                    +{comparison.value.toFixed(1)}%
                                </span>
                            </>
                        )}
                        {isNegative && (
                            <>
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <span className="text-red-600 font-medium">
                                    {comparison.value.toFixed(1)}%
                                </span>
                            </>
                        )}
                        {!isPositive && !isNegative && (
                            <span className="text-gray-500">No change</span>
                        )}
                        <span className="text-gray-500 ml-1">{comparison.period}</span>
                    </div>
                )}
            </div>
        </Card>
    );
};
