/**
 * Dashboard Toolbar Component
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Download, Palette, Plus, Edit3, Eye } from 'lucide-react';

interface DashboardToolbarProps {
    onSave?: () => void;
    onExport?: () => void;
    onThemeChange?: (theme: string) => void;
    onToggleEdit?: () => void;
    isEditing?: boolean;
}

const THEMES = [
    { name: 'Modern Blue', value: 'modern', color: 'bg-blue-500' },
    { name: 'Dark Mode', value: 'dark', color: 'bg-gray-900' },
    { name: 'Pastel', value: 'pastel', color: 'bg-pink-300' },
    { name: 'Corporate', value: 'corporate', color: 'bg-gray-700' }
];

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
    onSave,
    onExport,
    onThemeChange,
    onToggleEdit,
    isEditing = false
}) => {
    const [showThemes, setShowThemes] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('modern');

    const handleThemeSelect = (theme: string) => {
        setCurrentTheme(theme);
        onThemeChange?.(theme);
        setShowThemes(false);
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleEdit}
                    className={isEditing ? 'bg-blue-50 border-blue-300' : ''}
                >
                    {isEditing ? (
                        <>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                        </>
                    ) : (
                        <>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                        </>
                    )}
                </Button>

                <div className="h-6 w-px bg-gray-300" />

                <Button variant="outline" size="sm" onClick={onSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                </Button>

                <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowThemes(!showThemes)}
                    >
                        <Palette className="w-4 h-4 mr-2" />
                        Theme
                    </Button>

                    {showThemes && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            {THEMES.map((theme) => (
                                <button
                                    key={theme.value}
                                    onClick={() => handleThemeSelect(theme.value)}
                                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${currentTheme === theme.value ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full ${theme.color}`} />
                                    <span className="text-sm font-medium">{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
