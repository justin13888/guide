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

type Course = {
    name: string;
    code: string;
    description: string;
    requirements: string[];
};

export default function SideBar() {
    const [search, setSearch] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<string[]>(['CS 135', 'SE 212', 'STAT 231', 'ECE 350', 'PSYCH 207', 'ECON 101']);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [activeOption, setActiveOption] = useState<string>('');
    const [courses, setCourses] = useState<Course[]>([
        {
            name: 'Designing Functional Programs',
            code: 'CS 135',
            description: 'An introduction to the fundamentals of computer science through the application of elementary programming patterns in the functional style of programming. Syntax and semantics of a functional programming language. Tracing via substitution. Design, testing, and documentation. Linear and nonlinear data structures. Recursive data definitions. Abstraction and encapsulation. Generative and structural recursion. Historical context.',
            requirements: []
        },
        {
            name: 'Real-Time Operating Systems',
            code: 'ECE 350',
            description: 'Memory and virtual memory and caching; I/O devices, drivers, and permanent storage management; process scheduling; queue management in the kernel; real-time kernel development. Aspects of multi-core operating systems.',
            requirements: ['ECE 252', 'Level at least 3A BASc/BSE']
        },
        {
            name: 'Statistics',
            code: 'STAT 231',
            description: 'This course provides a systematic approach to empirical problem solving which will enable students to critically assess the sampling protocol and conclusions of an empirical study including the possible sources of error in the study and whether evidence of a causal relationship can be reasonably concluded. The connection between the attributes of a population and the parameters in the named distributions covered in STAT230 will be emphasized. Numerical and graphical techniques for summarizing data and checking the fit of a statistical model will be discussed. The method of maximum likelihood will be used to obtain point and interval estimates for the parameters of interest as well as testing hypotheses. The interpretation of confidence intervals and p-values will be emphasized. The Chi-squared and t distributions will be introduced and used to construct confidence intervals and tests of hypotheses including likelihood ratio tests. Contingency tables and Gaussian response models including the two sample Gaussian and simple linear regression will be used as examples.',
            requirements: ['(One of MATH 118, MATH 119, MATH 128, MATH 138, MATH 148) and (STAT 220 with a grade of at least 70% or STAT 230 or STAT 240)', 'Honours Math or Math/Phys students']
        },
        {
            name: 'Logic and Computation',
            code: 'SE 212',
            description: 'Formal logic. Proof systems and styles. Rudimentary model theory. Formal models of computation. Logic-based specification. Correctness proofs. Applications in software engineering.',
            requirements: ['CS 138 and MATH 135']
        },
        {
            name: 'Cognitive Processes',
            code: 'PSYCH 207',
            description: 'An examination and evaluation of selected topics dealing with human information processing such as attention, memory, pattern recognition, consciousness, language, dyslexia, decision making, and problem solving.',
            requirements: ['Level at least 1B']
        },
        {
            name: 'Introduction to Microeconomics',
            code: 'ECON 101',
            description: 'Basic principles of microeconomics, including supply and demand, market equilibrium, and consumer and producer behavior.',
            requirements: []
        },
    ]);
    
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
            <div className="px-8 pt-8 pb-2">
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
                <hr className="mt-4 -mx-8 border-t-2 border-gray-200" />
            </div>
            <div className="flex-1 px-8 overflow-y-auto">
                {activeOption && (
                    <div className="py-4">
                        {(() => {
                            const course = courses.find(course => course.code === activeOption);
                            if (course) {
                                return (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xl font-medium text-gray-500">{course.code}</span>
                                            <button 
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
                                                onClick={() => {}}
                                            >
                                                Add Course
                                            </button>
                                        </div>
                                        <h3 className="font-medium text-sm text-gray-900 mt-1">{course.name}</h3>
                                        <p className="text-sm text-gray-600 mt-2">{course.description}</p>
                                        {course.requirements.length > 0 && (
                                            <div className="mt-3">
                                                <h4 className="font-medium text-sm text-gray-700">Requirements:</h4>
                                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                                    {course.requirements.map((req, index) => (
                                                        <li key={index}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                );
                            }
                            return <p className="text-gray-600">No course information available</p>;
                        })()}
                    </div>
                )}
            </div>
        </div>
    )
}