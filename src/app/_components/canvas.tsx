'use client'; // if using Next.js App Router

import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import React from 'react';

function TermBlock({index, name} : {index : number, name : string}) {
  return <Group>
    <Rect fill="white" width={122} height={300} x={index*(122+12)} y={0}></Rect>
    <Rect fill="white" width={120} height={298} x={index*(122+12)+1} y={1}></Rect>
  </Group>
}

function CourseBlock({x, y, name, color} : {x : number, y : number, name : string, color : string}){
  return <Group draggable={true}>
    <Rect x={x} y={y} width={100} height={32} fill={color} cornerRadius={5}/>
    <Rect x={x+2} y={y+2} width={96} height={28} fill={"white"} cornerRadius={4}/>

    {/* <Text x={x} y={y+10}  text={name} width={100} align="center"/> */}
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
        <CourseBlock x={50} y={50} name='MATH 239' color={"#E93D82"}/>
      </Layer>
    </Stage>
  );
}

// todo
// center camera (do this on resize too)
  // add a button to do this?

// add text to term blocks
  // add hover with block styling
  // add drag and drop functionality

// style buttons correctly
// add text to buttons and resize off of that

// fix sidebar