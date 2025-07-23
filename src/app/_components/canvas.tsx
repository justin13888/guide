'use client'; // if using Next.js App Router

import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import React, { useEffect, useRef, useState, useContext } from 'react';
import type Konva from 'konva';
import { CourseModel, TermModel, CourseContext } from './ui';
// All Course and Term components have their state stored by the parent
// The Components themselves are merely a reflection of this state
// As a general rule we avoid using pointers for anything, because that makes it easy to introduce weird bugs

// Stores the state of each Course



function TermView({term}: {term: TermModel}) {

  return <Group x={term.x} y={term.y}>
    <Rect 
      stroke="#EDEDED" 
      strokeWidth={term.borderWidth}  

      fill="white" 
      width={term.width} 
      height={term.getRenderedHeight()} 
      
      x={0} 
      y={0}
    />
    <Text 
      fontFamily='Geist' 
      fontStyle='bold' 
      text={term.name} 
      fontSize={term.fontSize}
      x={term.padding} 
      y={term.padding}
    />

    {term.hovered &&
    <>
      <Rect 
        fill="#F8F8F8" 
        width={term.width-2*term.padding} 
        height={term.getRenderedHeight()-(2*term.padding+term.fontSize+term.innerPadding)} 
        
        x={term.padding} 
        y={term.getContainerStartY()}

        cornerRadius={5}
      />
      <Rect
        fill="#E5E5E5" 
        width={term.width-2*term.padding} 
        height={term.innerPadding/2}
        x={term.padding} 
        y={term.getContainerStartY()+term.insertIndex*(32+term.innerPadding)-term.innerPadding/2}
        cornerRadius={5}
      />
    </>
    }
  </Group>
}

function CourseView({course, setTerms, setCourses, canvasWidth, canvasHeight} : {course: CourseModel, setTerms : React.Dispatch<React.SetStateAction<TermModel[]>>, setCourses : React.Dispatch<React.SetStateAction<CourseModel[]>>, canvasWidth : number, canvasHeight : number}){

  const textRef = useRef<Konva.Text>(null);
  const blockRef = useRef<Konva.Group>(null);

  // Set size based on text size
  useEffect(()=>{
    setCourses(prevCourses => prevCourses.map(c => {
      const newCourse = c.clone();
      if(newCourse.name === course.name) {
        newCourse.width = textRef.current ? textRef.current.getTextWidth()+course.padding*2 : newCourse.width;
      }
      return newCourse;
    }))
    
  },[])

  function getPosition() {
    if(blockRef.current === null) return {x: 0, y: 0}; 
    const absolute = blockRef.current.getAbsolutePosition();
    const stageOffset = blockRef.current.getStage()?.position() ?? { x: 0, y: 0 };
    return {x: absolute.x - stageOffset.x + course.width/2, y: absolute.y - stageOffset.y + course.getFullHeight()/2};
  }

  function getDistance(x1 : number, y1 : number, x2 : number, y2: number) {
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2))
  }

  function onDragStart() {
    // Remove from term
    setTerms(
      prevTerms => 
      prevTerms.map(term => {
        const newTerm = term.clone();
        if(newTerm.courses.includes(course.name)) {
          newTerm.courses = newTerm.courses.filter(name => name !== course.name);
          updateCoursesInTerm(newTerm);
          fetch(`/api/terms/${term.name}/delete`, {
            method: 'delete',
            body: JSON.stringify({
              course: course.name.replace(" ", "-")
            })
          })
        }
        return newTerm;
      })
    ); 
    
  }
  

  /**
   * NOTE: Konva is pretty weird with with the x, y props. When you drag a widget around, obviously the props don't update, so we have a mismatch between our props and the actual position.
   * Now, suppose we change the x, y props. Then the real position updates to match. However, React optimizes it so that this only happens if the props are different. '
   * So if x doesn't change or y doesn't change our position doesn't update. 
   * 
   * This in particular is a problem when dragging a Course from one Term to another.
   * If the y position in the new term is the same, the actual y position won't update
   * To fix this we update the position as it moves.
   */
  
  function updateCoursesInTerm(newTerm : TermModel) {
        setCourses(prevCourses => 
        prevCourses.map((c) => {
            const newCourse = c.clone();
            if(newTerm.courses.includes(newCourse.name)) {
            newCourse.x = newTerm.x + newTerm.padding;
            newCourse.y = newTerm.getContainerStartY()+newTerm.courses.indexOf(newCourse.name)*(newCourse.getFullHeight() + newTerm.innerPadding);

            }
            return newCourse;
        })
        )
    }

  function onDragMove() {
    // Check collision, darken if necessary 
    const position = getPosition();
    // Also draw a line where it will be placed
    setTerms(
      prevTerms => 
      prevTerms.map(term => {
        const newTerm = term.clone();
        newTerm.hovered = newTerm.x <= position.x && position.x <= newTerm.x+newTerm.width && 0 <= position.y && position.y <= newTerm.getRenderedHeight();
        if(newTerm.hovered) {
          newTerm.insertIndex = term.getIdealInsertIndex(position.y);
        }
        return newTerm;
      })
    ); 
    
    setCourses(prevCourses => prevCourses.map(c => {
      const newCourse = c.clone();
      if(newCourse.name === course.name) {
        newCourse.x = position.x-course.width/2;
        newCourse.y = position.y-course.getFullHeight()/2;
      }
      return newCourse;
    }))
    
    

  }

  function onDragEnd() {
    const position = getPosition();

    const absolute = blockRef.current?.getAbsolutePosition();
    if(absolute && getDistance(absolute.x, absolute.y, canvasWidth, canvasHeight) < 100) {
      setCourses(prev => prev.filter((c : CourseModel) => c.name !== course.name ))
      return;
    }

    setTerms(
      prevTerms => 
      prevTerms.map(term => {
        const newTerm = term.clone();
        newTerm.hovered = false;
        const colliding = (newTerm.x <= position.x && position.x <= newTerm.x+newTerm.width && 0 <= position.y && position.y <= newTerm.getRenderedHeight());
        if(colliding) { 
          // Update positions, and height
          const idealIndex= newTerm.getIdealInsertIndex(position.y);
          newTerm.courses.splice(idealIndex, 0, course.name); 
          updateCoursesInTerm(newTerm);

          fetch(`/api/terms/${term.name}/add`, {
            method: 'post',
            body: JSON.stringify({
              course: course.name.replace(" ", "-")
            })
          });
        }
        return newTerm;
      })
    ); 
    
  }

  return <Group ref={blockRef} draggable={true} onMouseDown={()=>{blockRef.current?.moveToTop()}} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} x={course.x} y={course.y}>
    <Rect 
      stroke={course.color} 
      strokeWidth={course.borderWidth}

      fill={"white"} 
      width={course.width} 
      height={course.getFullHeight()} 

      x={0}
      y={0}
      cornerRadius={4}
    />

    <Text 
      ref={textRef} 
      x={course.padding} 
      y={course.padding+1} 
      fontFamily='Geist' 
      text={course.name} 
    />
  </Group>
}


export default function Canvas({width, height} : {width : number, height : number}) {
  
  const terms = useContext(CourseContext)?.terms;
  const setTerms = useContext(CourseContext)?.setTerms;
  const courses = useContext(CourseContext)?.courses;
  const setCourses = useContext(CourseContext)?.setCourses;
  

  return (
    <Stage width={width} height={height} draggable={true} x={width/8} y={height/4}>
      <Layer>
        {
          terms?.map((term) => <TermView key={term.name} term={term}></TermView>)
        }
      </Layer>
      <Layer>
        {
          // courses?.map(course=>course.prereqs.map(prereq => {
          //   const otherIndex = courses.findIndex(c => c.name == prereq);
          //   const otherCourse = courses[otherIndex];
          //   return <Line opacity={0.5} key={`${prereq}->${course.name}`} stroke="black" strokeWidth={2} points={[course.x+course.width/2, course.y+course.getFullHeight()/2, otherCourse ? otherCourse.x+otherCourse.width/2 : course.x, otherCourse ? otherCourse.y+otherCourse.getFullHeight()/2 : course.y]}/>
          // })).flat()
        }
      </Layer>
      <Layer>
        {
          setTerms && setCourses && courses?.map(course=><CourseView course={course} key={course.name} canvasWidth={width} canvasHeight={height} setTerms={setTerms} setCourses={setCourses} ></CourseView>)
        }
        {/* <CourseBlock x={0} y={0} name='CS 240' color={"#45DEC4"}/>
        <CourseBlock x={0} y={0} name='MATH 239' color={"#E93D82"}/>
        <CourseBlock x={0} y={0} name='PSYCH 207' color={"#7928CA"}/>
        <CourseBlock x={0} y={0} name='CO 250' color={"#3291FF"}/>
        <CourseBlock x={0} y={0} name='ENGL 192' color={"#34C759"}/>
        <CourseBlock x={0} y={0} name='ECE 105' color={"#F7B955"}/> */}
      </Layer>
      
    </Stage>
  );
}

// todo
// center camera  DONE
  // add a button to do this? (do this on resize too) 
  // add a trash can DONE
  // adding courses DONE
    // prereq chain / checking if it already exists / recommended courses + adding prereq chains + deleting entire lineage
  // Remove hard-coded 32s, also consider refactoring the 3 drag handlers (factor out sub-routines)
  // opacity should increase when the entire prereq chain is locked in
  // animation - should they follow each-other like the strings are elastics?
  // user table
  // fix sidebar DONE

  // notify justin of schema changes





  // courses should move to top layer when clicked DONE
  // Also you should be able to insert anywhere in the order DONE

// add text to term blocks DONE
  // add hover with block styling DONE
  // should expand by one on drop DONE
  // add drag and drop functionality DONE

// style buttons correctly DONE
// add text to buttons and resize off of that DONE

