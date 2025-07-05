'use client'; // if using Next.js App Router

import { Stage, Layer, Rect, Text, Group, type KonvaNodeComponent } from 'react-konva';
import React, { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';

function TermBlock({index, name} : {index : number, name : string}) {
  const width = 120;
  const height = 300;
  const BORDER_WIDTH = 1;
  const MARGIN = 12; 
  const PADDING = 12;
  const xPos = index*(width+MARGIN);

  return <Group>
    <Rect fill={"#EDEDED"} width={width + BORDER_WIDTH*2} height={height + BORDER_WIDTH*2} x={xPos-BORDER_WIDTH} y={-BORDER_WIDTH}></Rect>
    <Rect fill="white" width={width} height={height} x={xPos} y={0}></Rect>
    <Text fontFamily='Geist' fontStyle='bold' text={name} x={xPos+PADDING} y={PADDING} />
  </Group>
}

function CourseBlock({x, y, name, color} : {x : number, y : number, name : string, color : string}){
  const BORDER_WIDTH = 1.5;
  const PADDING = 10;

  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(32);
  const textRef = useRef<Konva.Text>(null);

  useEffect(()=>{
    if(textRef.current !== null) {
      setWidth(textRef.current.getTextWidth() + PADDING*2);
      setHeight(textRef.current.getTextHeight() + PADDING*2);
    }
  },[])

  return <Group draggable={true}>
    <Rect x={x-BORDER_WIDTH} y={y-BORDER_WIDTH} width={width+BORDER_WIDTH*2} height={height+BORDER_WIDTH*2} fill={color} cornerRadius={5}/>
    <Rect x={x} y={y} width={width} height={height} fill={"white"} cornerRadius={4}/>

    <Text  ref={textRef} x={x+PADDING} y={y+PADDING+1} fontFamily='Geist' text={name} />
  </Group>
}


export default function Canvas({width, height} : {width : number, height : number}) {
  const terms = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"];

  return (
    <Stage width={width} height={height} draggable={true}>
      <Layer>
        {
          terms.map((term, i) => <TermBlock key={i} index={i} name={term}></TermBlock>)
        }
      </Layer>
      <Layer>
        <CourseBlock x={0} y={0} name='CS 240' color={"#45DEC4"}/>
        <CourseBlock x={0} y={0} name='MATH 239' color={"#E93D82"}/>
        <CourseBlock x={0} y={0} name='PSYCH 207' color={"#7928CA"}/>
        <CourseBlock x={0} y={0} name='CO 250' color={"#3291FF"}/>
        <CourseBlock x={0} y={0} name='ENGL 192' color={"#34C759"}/>
        <CourseBlock x={0} y={0} name='ECE 105' color={"#F7B955"}/>
        
      </Layer>
    </Stage>
  );
}

// todo
// center camera (do this on resize too)
  // add a button to do this?
  // add a trash can
  // adding courses with prereq chains
  // courses should move to top layer when clicked

// add text to term blocks DONE
  // add hover with block styling
  // should expand by one on drop
  // add drag and drop functionality

// style buttons correctly DONE
// add text to buttons and resize off of that DONE

// fix sidebar