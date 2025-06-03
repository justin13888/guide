'use client'
import { Search } from '@geist-ui/icons'
import { useState } from 'react';

type ButtonStyles = {
    active: string;
    inactive: string;
};

type ColorMapping = {
    [key: string]: ButtonStyles;
};

export default function SideBar() {
    const [search, setSearch] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<string[]>(['CS 135', 'CS 145', 'MATH 124', 'ECE 350', 'PSYCH 207', 'ECON 101']);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [activeOption, setActiveOption] = useState<string>('');
    
    const buttonStyles: ColorMapping = {
        'CS': {
            active: 'bg-red-100 border-red-400 text-red-700',
            inactive: 'border-red-400 hover:bg-red-50 text-red-600'
        },
        'MATH': {
            active: 'bg-blue-100 border-blue-400 text-blue-700',
            inactive: 'border-blue-400 hover:bg-blue-50 text-blue-600'
        },
        'ECE': {
            active: 'bg-green-100 border-green-400 text-green-700',
            inactive: 'border-green-400 hover:bg-green-50 text-green-600'
        },
        'PSYCH': {
            active: 'bg-purple-100 border-purple-400 text-purple-700',
            inactive: 'border-purple-400 hover:bg-purple-50 text-purple-600'
        },
        'ECON': {
            active: 'bg-orange-100 border-orange-400 text-orange-700',
            inactive: 'border-orange-400 hover:bg-orange-50 text-orange-600'
        }
    } as const;

    const defaultStyles: ButtonStyles = {
        active: 'bg-gray-100 border-gray-400 text-gray-700',
        inactive: 'border-gray-400 hover:bg-gray-50 text-gray-600'
    };

    const getButtonStyles = (option: string): ButtonStyles => {
        const [prefix = ''] = option.split(' ');
        return buttonStyles[prefix as keyof typeof buttonStyles] || defaultStyles;
    };
    
    return (
        <div className="w-96 h-full bg-white border-l-2 border-b-2 border-gray-200 flex flex-col">
            <div className="p-8 flex-1 overflow-y-auto">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-300"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onBlur={() => {
                            setTimeout(() => setIsOpen(false), 100);
                        }}
                    />
                    <Search className="absolute left-3 top-2.5" size={20} stroke="#D1D5DB" />
                    {search.length > 0 && isOpen && (
                        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-400 rounded-lg">
                            {options.slice(0, 5).map((option) => (
                                <div 
                                    key={option} 
                                    className="py-2 px-4 hover:bg-gray-50 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        if (!selectedOptions.includes(option)) {
                                            setSelectedOptions([...selectedOptions, option]);
                                        }
                                        setSearch('');
                                        setIsOpen(false);
                                    }}
                                >
                                    {option}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {selectedOptions.map((option) => {
                        const styles = getButtonStyles(option);
                        return (
                            <button
                                key={option}
                                className={`px-3 py-1.5 border rounded-lg transition-colors ${
                                    activeOption === option ? styles.active : styles.inactive
                                }`}
                                onClick={() => {
                                    setActiveOption(activeOption === option ? '' : option);
                                }}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}