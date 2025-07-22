interface FilterButtonProps {
    name: string;
    checked: boolean;
    onToggle: () => void;
}

export default function FilterButton({ name, checked, onToggle }: FilterButtonProps) {
    return (
        <button 
            className="p-[6px] border-2 text-sm rounded-[5px] border-gray-700 transition-colors flex items-center gap-2 w-24"
            onClick={onToggle}
        >
            <div className={`w-3 h-3 border border-gray-400 rounded flex items-center justify-center ${checked ? 'bg-gray-700' : 'bg-white'}`}>
                {checked && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            {name}
        </button>
    );
} 