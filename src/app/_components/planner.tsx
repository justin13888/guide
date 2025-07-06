'use client'

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Trash, Home } from '@geist-ui/icons'

const Canvas = dynamic(() => import('./canvas'), {
  ssr: false,
});

export default function Planner() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({width: 500, height: 500}); 

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

  return <div className="h-full bg-[#EDEDED] flex justify-end items-end" ref={containerRef} >
      <div className='absolute'>
        <Canvas width={dimensions.width} height={dimensions.height}></Canvas>
      </div>
      <div className='flex flex-col gap-2 m-4'>
        {/* <Home className='hover:cursor-pointer'></Home> */}
        <Trash className=''></Trash>
      </div>
  </div>
}
