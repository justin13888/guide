'use client'

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Trash, Home, CheckSquare } from '@geist-ui/icons'

const Canvas = dynamic(() => import('./canvas'), {
  ssr: false,
});

export default function Planner() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({width: 500, height: 500}); 
  const [alert, setAlert] = useState<{ open: boolean, courses: Array<{department: string, course_number: string}>,
                                       antireqs: Array<{department: string, course_number: string,
                                                        conflict_department: string, conflict_course_number: string}>, type: string }>
                                                        ({ open: false, courses: [], antireqs: [], type: "" });
  const alertTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(()=>{
    function onResize(){
      if(containerRef.current !== null){
        setDimensions({width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight})
      }
    } 
    window.addEventListener('resize', onResize);
    onResize();

    return ()=>{window.removeEventListener('resize', onResize)}
  },[]);

  async function handleValidate() {
    try {
      const validateRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'master'
        })
      });
      
      const validateData = await validateRes.json();
      if (validateData.unsatisfied.length != 0) {
        setAlert({ open: true, courses: validateData.unsatisfied, antireqs: [], type: "prereq"});
        if (alertTimeout.current) clearTimeout(alertTimeout.current);
        alertTimeout.current = setTimeout(() => {
          setAlert({ open: false, courses: [], antireqs: [], type: "" });
        }, 3000);
        return;
      }

      const antireqRes = await fetch('/api/courses/antirequisites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'master'
        })
      });
      
      const antireqData = await antireqRes.json();
      if (antireqData.unsatisfied.length != 0) {
        const filteredAntireqs = [];
        for (let i = 0; i < antireqData.unsatisfied.length; i++) {
          const curPair = antireqData.unsatisfied[i];
          let isDuplicate = false;
          
          for (let j = 0; j < i; j++) {
            const prevPair = antireqData.unsatisfied[j];
            
            if (curPair.department === prevPair.conflict_department && 
                 curPair.course_number === prevPair.conflict_course_number && 
                 curPair.conflict_department === prevPair.department && 
                 curPair.conflict_course_number === prevPair.course_number) {
              isDuplicate = true;
              break;
            }
          }
          
          if (!isDuplicate) {
            filteredAntireqs.push(curPair);
          }
        }
        
        setAlert({ open: true, courses: [], antireqs: filteredAntireqs, type: "antireq"});
        if (alertTimeout.current) clearTimeout(alertTimeout.current);
        alertTimeout.current = setTimeout(() => {
          setAlert({ open: false, courses: [], antireqs: [], type: "" });
        }, 3000);
        return;
      }

      setAlert({ open: true, courses: [], antireqs: [], type: "valid"});
      if (alertTimeout.current) clearTimeout(alertTimeout.current);
      alertTimeout.current = setTimeout(() => {
        setAlert({ open: false, courses: [], antireqs: [], type: "" });
      }, 3000);
    } catch (err) {
      console.log(err);
      setAlert({ open: false, courses: [], antireqs: [], type: "" });
    }
  }

  useEffect(() => {
    return () => {
      if (alertTimeout.current) clearTimeout(alertTimeout.current);
    };
  }, []);

  return <div className="h-full bg-[#EDEDED] flex justify-end items-end" ref={containerRef} >
      <div className='absolute'>  
        <Canvas width={dimensions.width} height={dimensions.height}/>
      </div>
      <div className='flex flex-col gap-2 m-4 z-10'>
        {/* <Home className='hover:cursor-pointer'></Home>   */}
        <CheckSquare className='hover:cursor-pointer' onClick={handleValidate}></CheckSquare>
        <Trash className='hover:cursor-pointer'></Trash>
      </div>
      {alert.open && alert.type == "prereq" && (
        <div className="fixed top-25 left-13/32 transform -translate-x-1/2 bg-red-400 text-white shadow-lg rounded-lg px-6 py-3 z-50 min-w-[300px] max-w-[90vw] text-center text-base font-medium">
          The following courses are missing prerequisites: {alert.courses.map((c) => `${c.department} ${c.course_number}`).join(', ')}
        </div>
      )}
      {alert.open && alert.type == "antireq" && (
        <div className="fixed top-25 left-13/32 transform -translate-x-1/2 bg-red-400 text-white shadow-lg rounded-lg px-6 py-3 z-50 min-w-[300px] max-w-[90vw] text-center text-base font-medium">
          The following courses are antirequisites: {alert.antireqs.map((c) => `${c.department} ${c.course_number} and ${c.conflict_department} ${c.conflict_course_number}`).join(', ')}
        </div>
      )}
      {alert.open && alert.type == "valid" && (
        <div className="fixed top-25 left-13/32 transform -translate-x-1/2 bg-green-400 text-white shadow-lg rounded-lg px-6 py-3 z-50 min-w-[300px] max-w-[90vw] text-center text-base font-medium">
          Valid course schedule
        </div>
      )}
  </div>
}
