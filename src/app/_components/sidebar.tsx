'use client'
import { Search } from '@geist-ui/icons'
import { useEffect, useState } from 'react';

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

// TODO: Display more course information in the sidebar
// TODO: Separate requirements using 'and'

// RUN: docker compose up
//      pnpm run db:push
//      pnpm seed

export default function SideBar() {
    const [search, setSearch] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [activeOption, setActiveOption] = useState<string>('');
    const [courses, setCourses] = useState<Course[]>([]);
    
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

    useEffect(() => {
        async function fetchCourses() {
          try {
            const response = await fetch('/api/courses');
            const data = await response.json();
            const transformedCourses = data.map((course: any) => ({
              name: course.title || '',
              code: `${course.department} ${course.courseNumber}`,
              description: course.description || '',
              requirements: course.requirements ? [course.requirements] : []
            }));
            const courseCodes = transformedCourses.map((course: Course) => course.code);
            setOptions(courseCodes);
            setCourses(transformedCourses);
          } catch (error) {
            console.error('Error fetching courses:', error);
          }
        }
        fetchCourses();
      }, []);

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
                            {options
                                .filter(option => 
                                    option.toLowerCase().includes(search.toLowerCase())
                                )
                                .slice(0, 5)
                                .length > 0 ? (
                                    options
                                        .filter(option => 
                                            option.toLowerCase().includes(search.toLowerCase())
                                        )
                                        .slice(0, 5)
                                        .map((option) => (
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
                                        ))
                                ) : (
                                    <div className="py-2 px-4 text-gray-500 first:rounded-t-lg last:rounded-b-lg">
                                        No courses found matching "{search}"
                                    </div>
                                )}
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