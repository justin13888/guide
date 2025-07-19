'use client'
import { createContext, useEffect, useState } from 'react';

import SideBar from "~/app/_components/sidebar";
import Planner from "~/app/_components/planner";

type CourseContextType = {
    courses: CourseModel[],
    terms: TermModel[], 
    setTerms : React.Dispatch<React.SetStateAction<TermModel[]>>, 
    setCourses : React.Dispatch<React.SetStateAction<CourseModel[]>>
}
export const CourseContext = createContext<CourseContextType | undefined>(undefined);

export class CourseModel {
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
export class TermModel {
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

export default function UI() {
    const TERM_NAMES = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"];
    
    
    
    function getInitialTerms() {
        let currentX = 0;
        return TERM_NAMES.map((name)=>{
            const termModel = new TermModel(name, currentX, 0);
            currentX += termModel.getFullWidth();
            return termModel;
        });
    }
    //const SAMPLE_COURSES = ['CS 240', 'MATH 239', 'PSYCH 207', 'CO 250', 'ENGL 192', 'ECE 105', 'SE 212', 'STAT 206'];
    //SAMPLE_COURSES.map((name)=>{return new CourseModel(name, 0, 312, ['CS 240']);})
    const [terms, setTerms] = useState<TermModel[]>(getInitialTerms());
    const [courses, setCourses] = useState<CourseModel[]>([]);
    
    useEffect(()=>{
        TERM_NAMES.forEach(async (name : string)=> {
            const response = await fetch(`/api/terms/${name}`);
            const data = await response.json(); 
            if(data["error"]) return;
            
            const newCourses = data.map((item : {department : string, course_number : string}) => `${item.department} ${item.course_number}`);
            
            terms.forEach((term)=>{
                if(term.name !== name) return;
                setCourses(prev => [...prev, ...newCourses.map((name : string, i : number) => {
                    const newCourse = new CourseModel(name, term.x + term.padding, 0)
                    newCourse.y = term.getContainerStartY()+i*(newCourse.getFullHeight() + term.innerPadding);
                    return newCourse
                })])
            })
            

            setTerms(
                prevTerms => 
                prevTerms.map(term => {
                    const newTerm = term.clone();
                    // Add courses
                    if(newTerm.name === name){
                        newTerm.courses.push(...newCourses);
                    }
                    return newTerm;
                })
            ); 
        })
    }, []);


    return <CourseContext.Provider value={{courses : courses, terms: terms, setCourses : setCourses, setTerms : setTerms}}>
        <div className="flex-1">
            <Planner/>
        </div>
        <SideBar />
    </ CourseContext.Provider>
}