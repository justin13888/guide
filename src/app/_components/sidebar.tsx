'use client'
import { Search } from '@geist-ui/icons'
import { useEffect, useState, useContext } from 'react';
import { CourseContext, CourseModel } from './ui';
import { ColorRing } from 'react-loader-spinner'

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
    postrequisites?: string[];
    antirequisites?: string[];
};

type PostRequisite = {
    course_number: string;
    department: string;
}

type AntiRequisite = {
    department: string;
    course_number: string;
    title: string;
}

type CoursesState = {
    [key: string]: Course;
};

type Department = {
    department: string,
    count: number
}

// TODO: Display more course information in the sidebar
// TODO: Add filters or advanced searching
// TODO: Separate requirements using 'and'
// TODO: Some kind of visual?

// RUN: docker compose up
//      pnpm run db:push
//      pnpm seed
//      pnpm run dev

const buttonStyles: ColorMapping = {
    // 'CS': {
    //     active: 'bg-red-100 border-red-400 text-red-700',
    //     inactive: 'border-red-400 hover:bg-red-50 text-red-600'
    // },
    // 'MATH': {
    //     active: 'bg-blue-100 border-blue-400 text-blue-700',
    //     inactive: 'border-blue-400 hover:bg-blue-50 text-blue-600'
    // },
    // 'ECE': {
    //     active: 'bg-green-100 border-green-400 text-green-700',
    //     inactive: 'border-green-400 hover:bg-green-50 text-green-600'
    // },
    // 'PSYCH': {
    //     active: 'bg-purple-100 border-purple-400 text-purple-700',
    //     inactive: 'border-purple-400 hover:bg-purple-50 text-purple-600'
    // },
    // 'ECON': {
    //     active: 'bg-orange-100 border-orange-400 text-orange-700',
    //     inactive: 'border-orange-400 hover:bg-orange-50 text-orange-600'
    // }
} as const;

const defaultStyles: ButtonStyles = {
    active: 'bg-gray-100 border-gray-400 text-gray-700',
    inactive: 'border-gray-400 hover:bg-gray-50 text-gray-600'
};

export default function SideBar() {
    const [search, setSearch] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [activeOption, setActiveOption] = useState<string>('');
    const [courses, setCourses] = useState<CoursesState>({});
    const [departments, setDepartments] = useState<Array<Department>>([]);

    const setPlannerCourses = useContext(CourseContext)?.setCourses;
    
    useEffect(() => {
        async function fetchCourses() {
          try {
            const response = await fetch('/api/courses');
            const data = await response.json();
            const transformedCourses: CoursesState = {};
            data.forEach((course: any) => {
              const code = `${course.department} ${course.course_number}`;
              transformedCourses[code] = {
                name: '',
                code: code,
                description: '',
                requirements: [],
              };
            });
            const courseCodes = Object.keys(transformedCourses);
            setOptions(courseCodes);
            setCourses(transformedCourses);
          } catch (error) {
            console.error('Error fetching courses:', error);
          }
        }
        async function fetchDepartments() {
            const response = await fetch(`/api/courses/departments`); 
            const json = await response.json();

            setDepartments(json.data);
        }

        fetchCourses();
        fetchDepartments();
      }, []);

    const getButtonStyles = (option: string): ButtonStyles => {
        const [prefix = ''] = option.split(' ');
        return buttonStyles[prefix as keyof typeof buttonStyles] || defaultStyles;
    };
    
    const fetchCourseDetails = async (option: string) => {
        if (courses[option]?.description) {
            return;
        }

        const [department, courseNumber] = option.split(' ');
        const response = await fetch(`/api/courses/${department}-${courseNumber}`);
        const data = await response.json();
        
        const response2 = await fetch(`/api/courses/postrequisites/${department}-${courseNumber}`);
        const data2 = await response2.json();

        const response3 = await fetch(`/api/courses/antirequisites/${department}-${courseNumber}`);
        const data3 = await response3.json();

        setCourses(prev => ({
            ...prev,
            [option]: {
                code: option,
                name: data.title || '',
                description: data.description || '',
                requirements: data.requirements ? data.requirements.split(';').map((req: string) => req.trim()) : [],
                postrequisites: data2.data.map((course: PostRequisite) => `${course.department} ${course.course_number}`),
                antirequisites: data3.data.map((course: AntiRequisite) => `${course.department} ${course.course_number} - ${course.title}`)
            }
        }));

    }


    useEffect(()=> {
        setActiveOption('')
        setSelectedOptions(search === "" ? [] : options
        .filter(option => 
            option.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5)
        )
    },[search])

    return (
        <div className="w-[400px] h-full bg-white border-l-2 border-b-2 border-gray-200 flex flex-col">
            <div className="px-[24px] py-[24px] border-b-2 border-gray-200">
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
                </div>
                {search !== "" && (
                    selectedOptions.length > 0 ? 
                    <div className="mt-[12px] flex flex-wrap gap-2">
                        {selectedOptions.map((option) => {
                            const styles = getButtonStyles(option);
                            return (
                                <button
                                    key={option}
                                    className={`p-[6px] border-2 text-sm rounded-[5px] border-gray-700 transition-colors ${
                                        activeOption === option ? styles.active : styles.inactive
                                    }`}
                                    onClick={() => {
                                        fetchCourseDetails(option);
                                        setActiveOption(option);
                                    }}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div> 
                    :
                    <div className="mt-[12px] text-gray-500">
                        No courses found matching search
                    </div>
                    )
                }
            </div>
            <div className="flex-1 px-8 overflow-y-auto">
                {   activeOption && 
                    <div className="py-4">
                        {(() => {
                            const course = courses[activeOption];
                            if (course) {
                                return (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xl font-medium text-gray-500">{course.code}</span>
                                            <button 
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors hover:cursor-pointer"
                                                onClick={() => {setPlannerCourses && setPlannerCourses(prev => [...prev, new CourseModel(course.code, 0, 312)])}}
                                            >
                                                Add Course
                                            </button>
                                        </div>
                                        {
                                            course.name == "" && <div className='flex justify-center'>
                                                <ColorRing  visible={true} height="50" width="50"  colors={['black', 'black', 'black', 'black', 'black']}></ColorRing>
                                            </div>
                                        }
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
                                        {course.postrequisites && course.postrequisites.length > 0 && (
                                            <div className="mt-3">
                                                <h4 className="font-medium text-sm text-gray-700">Leads to:</h4>
                                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                                    {course.postrequisites.map((postreq, index) => (
                                                        <li key={index}>{postreq}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {course.antirequisites && course.antirequisites.length > 0 && (
                                            <div className="mt-3">
                                                <h4 className="font-medium text-sm text-gray-700">Antirequisites:</h4>
                                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                                    {course.antirequisites.map((antireq, index) => (
                                                        <li key={index}>{antireq}</li>
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
                }
            </div>
        </div>
    )
}

{/* <div className="py-4">
    <h2 className='pb-4'>Use the search bar to find a course!</h2>
    <h2>Departments</h2>
{
    departments.map(item => <div key={item.department} className='flex'>
        <div className='w-24'>{item.department}</div>
        <div>{item.count}</div>
    </div>)
    
} */}