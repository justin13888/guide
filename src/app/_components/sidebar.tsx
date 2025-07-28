'use client'
import { Search, Sliders } from '@geist-ui/icons'
import { useEffect, useState, useContext } from 'react';
import { CourseContext, CourseModel, PrereqTreeNode } from './ui';
import { ColorRing } from 'react-loader-spinner'
import FilterButton from './filterButton';

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
//      pnpm run import-courses
//      pnpm install
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

type Node = {
    department: string,
    course_number: string,
    id: number,
    parent_id: number,
    relation_type: "OR" | "AND" | null
}
export default function SideBar() {
    const [search, setSearch] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);


    const [courses, setCourses] = useState<CoursesState>({});
    const [departments, setDepartments] = useState<Array<Department>>([]);
    const [filtersOpen, setFiltersOpen] = useState(false);


    const [fallSelected, setFallSelected] = useState(false);
    const [winterSelected, setWinterSelected] = useState(false);
    const [springSelected, setSpringSelected] = useState(false);

    const [level1xxSelected, setLevel1xxSelected] = useState(false);
    const [level2xxSelected, setLevel2xxSelected] = useState(false);
    const [level3xxSelected, setLevel3xxSelected] = useState(false);
    const [level4xxSelected, setLevel4xxSelected] = useState(false);
    const [level5xxSelected, setLevel5xxSelected] = useState(false);
    const [level6xxSelected, setLevel6xxSelected] = useState(false);
    const [level7xxSelected, setLevel7xxSelected] = useState(false);
    const [level8xxSelected, setLevel8xxSelected] = useState(false);
    const [level9xxSelected, setLevel9xxSelected] = useState(false);

    const [recommendedCourses, setRecommendedCourses] = useState<string[]>([]);
    const setPlannerCourses = useContext(CourseContext)?.setCourses;
    const plannerTerms = useContext(CourseContext)?.terms;
    const activeOption = useContext(CourseContext)?.activeOption;
    const setActiveOption = useContext(CourseContext)?.setActiveOption;


    async function addCourse(courseCode : string) {
        // const response = await fetch(`/api/courses/prerequisites/${courseCode.replace(" ", "-")}`);
        // const data = await response.json();
        
        // const node_map : Record<number, PrereqTreeNode>= {};
        // const nodes : Array<Node> = data.nodes;
        // var root : PrereqTreeNode | null = null;

        // for(const node of nodes) {
        //     var name = "";
        //     if(node.department && node.course_number) {
        //         name = `${node.department} ${node.course_number}`;
        //     }
        //     node_map[node.id] = new PrereqTreeNode(name, node.relation_type ?? "LEAF");

        //     if(node.id === data.root_id[0]?.root_node_id) {
        //         root = node_map[node.id] ?? null;
        //     }
        // }

        // for(const node of nodes) {
        //     node_map[node.parent_id]?.children.push(node_map[node.id]);
        // }
        // console.log(root)

        // setPlannerCourses(prev => {
        //         const courses = prev.map((course) => course.name)

        //         return prev.map((course) => {
        //         const newCourse = course.clone();
        //         newCourse.color = newCourse.prereqs == null || newCourse.prereqs.satisfied(courses) ? "black" : "red";
        //         return newCourse;
        //         })
        //     })
        if(setPlannerCourses) {
            setPlannerCourses(prev => {
                if(prev.map(course => course.name).includes(courseCode)) return prev;
                return [...prev, new CourseModel(courseCode, 0, 312)];
            })

            
        }
    }

    useEffect(()=>{
        async function getRecommendations() {
            const response = await fetch('/api/recommend')
            const data = await response.json();
            setRecommendedCourses(data.map((item : {course_number : string, department : string}) => `${item.department} ${item.course_number}`))
        }
        getRecommendations();
    },[plannerTerms])

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
    
    useEffect(()=>{
        if(activeOption) fetchCourseDetails(activeOption);
    },[activeOption])

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

    const handleFilterButton = async () => {
        if (!filtersOpen) {
            setFiltersOpen(true);
        } else {
            handleSaveFilters();
        }
    }

    const handleSaveFilters = async () => {
        let queryString = '';

        if (fallSelected) {
            queryString += 'fall=true&';
        } else {
            queryString += 'fall=false&';
        }
        if (winterSelected) {
            queryString += 'winter=true&';
        } else {
            queryString += 'winter=false&';
        }
        if (springSelected) {
            queryString += 'spring=true&';
        } else {
            queryString += 'spring=false&';
        }
        
        queryString += 'levels=';
        if (level1xxSelected) queryString += '1%,';
        if (level2xxSelected) queryString += '2%,';
        if (level3xxSelected) queryString += '3%,';
        if (level4xxSelected) queryString += '4%,';
        if (level5xxSelected) queryString += '5%,';
        if (level6xxSelected) queryString += '6%,';
        if (level7xxSelected) queryString += '7%,';
        if (level8xxSelected) queryString += '8%,';
        if (level9xxSelected) queryString += '9%,';
        
        if (queryString.endsWith(',')) {
            queryString = queryString.slice(0, -1);
        }
        
        try {
            const response = await fetch(`/api/courses/filter?${queryString}`);
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
            console.error('Error applying filters:', error);
        }
        
        setFiltersOpen(false);
    }

    useEffect(()=> {
        if(setActiveOption) setActiveOption('')
        setSelectedOptions(search === "" ? [] : options
        .filter(option => 
            option.toLowerCase().replaceAll(" ", "").includes(search.toLowerCase().replaceAll(" ", ""))
        )
        //.slice(0, 5)
        )
    },[search, filtersOpen])

    return (
        <div className="w-[400px] h-full bg-white border-l-2 border-b-2 border-gray-200 flex flex-col">
            <div className="px-[24px] py-[24px] border-b-2 border-gray-200">
                <div className="flex gap-2">
                    <div className="relative flex-1">
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
                    <button 
                        className="w-11 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-center"
                        onClick={handleFilterButton}
                    >
                        <Sliders size={16} stroke="#6B7280" />
                    </button>
                </div>
                {filtersOpen && (
                    <div className="mt-[12px]">
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Term</h3>
                                <div className="flex flex-col gap-2">
                                    <FilterButton name="Fall" checked={fallSelected} onToggle={() => setFallSelected(!fallSelected)} />
                                    <FilterButton name="Winter" checked={winterSelected} onToggle={() => setWinterSelected(!winterSelected)} />
                                    <FilterButton name="Spring" checked={springSelected} onToggle={() => setSpringSelected(!springSelected)} />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Level</h3>
                                <div className="flex flex-col gap-2">
                                    <FilterButton name="1xx" checked={level1xxSelected} onToggle={() => setLevel1xxSelected(!level1xxSelected)} />
                                    <FilterButton name="2xx" checked={level2xxSelected} onToggle={() => setLevel2xxSelected(!level2xxSelected)} />
                                    <FilterButton name="3xx" checked={level3xxSelected} onToggle={() => setLevel3xxSelected(!level3xxSelected)} />
                                    <FilterButton name="4xx" checked={level4xxSelected} onToggle={() => setLevel4xxSelected(!level4xxSelected)} />
                                    <FilterButton name="5xx" checked={level5xxSelected} onToggle={() => setLevel5xxSelected(!level5xxSelected)} />
                                    <FilterButton name="6xx" checked={level6xxSelected} onToggle={() => setLevel6xxSelected(!level6xxSelected)} />
                                    <FilterButton name="7xx" checked={level7xxSelected} onToggle={() => setLevel7xxSelected(!level7xxSelected)} />
                                    <FilterButton name="8xx" checked={level8xxSelected} onToggle={() => setLevel8xxSelected(!level8xxSelected)} />
                                    <FilterButton name="9xx" checked={level9xxSelected} onToggle={() => setLevel9xxSelected(!level9xxSelected)} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button 
                                className="px-8 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                                onClick={handleSaveFilters}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}
                {
                    !filtersOpen && 
                    (
                        (search !== "") ? 
                        (
                            selectedOptions.length > 0 ? 
                            <div className="mt-[12px] flex flex-wrap gap-2 max-h-[130px] overflow-y-auto">
                                {selectedOptions.map((option) => {
                                    const styles = getButtonStyles(option);
                                    return (
                                        <button
                                            key={option}
                                            className={`p-[6px] border-2 text-sm rounded-[5px] border-gray-700 transition-colors ${
                                                activeOption === option ? styles.active : styles.inactive
                                            }`}
                                            onClick={() => {
                                                if(setActiveOption)setActiveOption(option);
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
                        :
                        (
                            <>
                                <div className="mt-[12px] text-gray-500">
                                    Recommmended Courses:
                                </div>
                                <div className="mt-[12px] flex flex-wrap gap-2 max-h-[130px] overflow-y-auto">
                                    {recommendedCourses.map((option) => {
                                        const styles = getButtonStyles(option);
                                        return (
                                            <button
                                                key={option}
                                                className={`p-[6px] border-2 text-sm rounded-[5px] border-gray-700 transition-colors ${
                                                    activeOption === option ? styles.active : styles.inactive
                                                }`}
                                                onClick={() => {
                                                    if(setActiveOption)setActiveOption(option);
                                                }}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div> 
                            </>
                        )
                    )
                    
                }
            </div>
            <div className="flex-1 px-[24px] py-[24px] overflow-y-hidden">
                {   activeOption && !filtersOpen &&
                    <div className="h-full overflow-y-auto">
                        {(() => {
                            const course = courses[activeOption];
                            if (course) {
                                return (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xl font-medium text-gray-500">{course.code}</span>
                                            <button 
                                                className="px-3 py-1.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors hover:cursor-pointer"
                                                onClick={()=>{addCourse(course.code)}}
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
                {
                    !activeOption &&
                    <div className='h-full overflow-y-auto'>
                    <div className='flex text-gray-500 pb-[12px]'>
                            <div className='w-36'>Department</div>
                            <div>Number of Courses</div>
                    </div>
                    {
                        departments.length > 0 ? 
                        departments.map(item => <div key={item.department} className='flex text-gray-500'>
                            <div className='w-36'>{item.department}</div>
                            <div>{item.count}</div>
                        </div>)
                        :
                        <div className='flex justify-center'>
                            <ColorRing  visible={true} height="50" width="50"  colors={['black', 'black', 'black', 'black', 'black']}></ColorRing>
                        </div>
                    }
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