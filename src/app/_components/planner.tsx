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
  const [alert, setAlert] = useState<{ open: boolean, courses: Array<{department: string, course_number: string}> }>({ open: false, courses: [] });
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

  function handleValidate() {
    fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'master'
      })
    })
    .then(res => res.json())
    .then(data => {
      setAlert({ open: true, courses: data.unsatisfied || [] });
      if (alertTimeout.current) clearTimeout(alertTimeout.current);
      alertTimeout.current = setTimeout(() => {
        setAlert({ open: false, courses: [] });
      }, 3000);
    })
    .catch(err => {
      setAlert({ open: false, courses: [] });
    });
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
      {alert.open && alert.courses.length > 0 && (
        <div className="fixed top-25 left-13/32 transform -translate-x-1/2 bg-red-400 text-white shadow-lg rounded-lg px-6 py-3 z-50 min-w-[300px] max-w-[90vw] text-center text-base font-medium">
          The following courses are missing prerequisites: {alert.courses.map((c, i) => `${c.department} ${c.course_number}`).join(', ')}
        </div>
      )}
      {alert.open && alert.courses.length === 0 && (
        <div className="fixed top-25 left-13/32 transform -translate-x-1/2 bg-green-400 text-white shadow-lg rounded-lg px-6 py-3 z-50 min-w-[300px] max-w-[90vw] text-center text-base font-medium">
          Valid course schedule
        </div>
      )}
  </div>
}
