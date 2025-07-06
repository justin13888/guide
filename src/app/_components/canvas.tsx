'use client'; // if using Next.js App Router

import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import React, { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import { X } from '@geist-ui/icons';

// All Course and Term components have their state stored by the parent
// The Components themselves are merely a reflection of this state
// As a general rule we avoid using pointers for anything, because that makes it easy to introduce weird bugs

// Stores the state of each Course
class CourseModel {
  name: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  padding: number;
  borderWidth: number; 
  prereqs: Array<string>;
  width: number; 

  constructor(name: string, x: number, y: number, prereqs: Array<string> = [], color: string = 'black', fontSize: number = 12, padding: number = 10, borderWidth: number = 1.5,  width: number = 100) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.color = color;
    this.fontSize = fontSize;
    this.padding = padding;
    this.borderWidth = borderWidth;
    this.width = width;
    this.prereqs = prereqs;
  }

  getFullHeight() {
    return this.fontSize + this.padding*2;
  }

  clone() {
    return new CourseModel(this.name, this.x, this.y, [...this.prereqs], this.color, this.fontSize, this.padding, this.borderWidth, this.width);
  }
}
// Stores state of each Term 
class TermModel {
  name: string;
  x: number; 
  y: number; 
  containerHeight: number;
  width: number; 
  height: number; 
  fontSize: number;
  padding: number;
  borderWidth: number;
  innerPadding: number; 
  marginRight : number;
  hovered: boolean;
  insertIndex: number;
  courses: Array<string>; 

  constructor(name: string, x : number, y : number, containerHeight: number = 0, hovered : boolean = false, width: number = 120, height: number = 300, fontSize: number = 12, padding: number = 12, borderWidth: number = 1, innerPadding: number = 6, marginRight : number = 12, insertIndex : number = 0) {
    this.name = name;
    this.x = x; 
    this.y = y;
    this.width = width; 
    this.height = height;
    this.containerHeight = containerHeight;
    this.fontSize = fontSize;
    this.padding = padding;
    this.borderWidth = borderWidth;
    this.innerPadding = innerPadding; 
    this.marginRight = marginRight;
    this.hovered = hovered;
    this.insertIndex = insertIndex;
    this.courses = [];
  }

  getFullWidth(){
    return this.width + this.marginRight; 
  }

  getRenderedHeight(){
    this.containerHeight = (32 + this.innerPadding)*this.courses.length; // Temporary work-around, value should not be hard-coded
    return Math.max(this.height, this.getContainerStartY()+this.containerHeight+this.padding)
  }

  getContainerStartY(){
    return this.padding + this.fontSize + this.innerPadding;
  }

  clone() {
    const clone = new TermModel(this.name, this.x, this.y, this.containerHeight, this.hovered, this.width, this.height, this.fontSize, this.padding, this.borderWidth, this.innerPadding, this.marginRight, this.insertIndex)
    clone.courses = [...this.courses];
    return clone;
  }

  getIdealInsertIndex(y : number) {
    let idealIndex = 0;
    let currentY = this.getContainerStartY();
    let minimum =  Math.abs(y - currentY);

    for(let i = 0; i < this.courses.length; i++) {
      currentY += this.innerPadding + 32; // Hard-coded, not ideal
      const difference = Math.abs(y - currentY);
      if(difference < minimum) {
        minimum = difference;
        idealIndex = i+1;
      }
    }

    return idealIndex; 
  }
};


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
        y={term.getContainerStartY()+term.insertIndex*(32+term.innerPadding)-term.innerPadding}
        cornerRadius={5}
      />
    </>
    }
  </Group>
}

function CourseView({course, setTerms, setCourses} : {course: CourseModel, setTerms : React.Dispatch<React.SetStateAction<TermModel[]>>, setCourses : React.Dispatch<React.SetStateAction<CourseModel[]>>}){

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

  function onDragStart() {
    // Remove from term
    setTerms(
      prevTerms => 
      prevTerms.map(term => {
        const newTerm = term.clone();
        if(newTerm.courses.includes(course.name)) {
          newTerm.courses = newTerm.courses.filter(name => name !== course.name);
          updateCoursesInTerm(newTerm);
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
    const TERM_NAMES = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"]

  function getInitialTerms() {
    let currentX = 0;
    return TERM_NAMES.map((name)=>{
      const termModel = new TermModel(name, currentX, 0);
      currentX += termModel.getFullWidth();
      return termModel;
    });
  }
  const [terms, setTerms] = useState<Array<TermModel>>(getInitialTerms());
  

  const SAMPLE_COURSES = ['CS 240', 'MATH 239', 'PSYCH 207', 'CO 250', 'ENGL 192', 'ECE 105', 'SE 212', 'STAT 206'];
  const [courses, setCourses] = useState<Array<CourseModel>>(SAMPLE_COURSES.map((name)=>{
    return new CourseModel(name, 0, 312, ['CS 240']);
  }));


  return (
    <Stage width={width} height={height} draggable={true} x={width/8} y={height/4}>
      <Layer>
        {
          terms.map((term) => <TermView key={term.name} term={term}></TermView>)
        }
      </Layer>
      <Layer>
        {
          courses.map(course=>course.prereqs.map(prereq => {
            const otherIndex = courses.findIndex(c => c.name == prereq);
            const otherCourse = courses[otherIndex];
            return <Line opacity={0.5} key={`${prereq}->${course.name}`} stroke="black" strokeWidth={2} points={[course.x+course.width/2, course.y+course.getFullHeight()/2, otherCourse ? otherCourse.x+otherCourse.width/2 : course.x, otherCourse ? otherCourse.y+otherCourse.getFullHeight()/2 : course.y]}/>
          })).flat()
        }
      </Layer>
      <Layer>
        {
          courses.map(course=><CourseView course={course} key={course.name} setTerms={setTerms} setCourses={setCourses} ></CourseView>)
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
  // add a trash can (delete hte lineage)
  // adding courses with prereq chains
  // Remove hard-coded 32s, also consider refactoring the 3 drag handlers (factor out sub-routines)
  // opacity should increase when the entire prereq chain is locked in
  // animation - should they follow each-other like the strings are elastics?

  // courses should move to top layer when clicked DONE
  // Also you should be able to insert anywhere in the order DONE

// add text to term blocks DONE
  // add hover with block styling DONE
  // should expand by one on drop DONE
  // add drag and drop functionality DONE

// style buttons correctly DONE
// add text to buttons and resize off of that DONE

// fix sidebar