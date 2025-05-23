"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, PlusCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Course {
  id: string
  code: string
  name: string
  credits: number
  subjectType: "ETE" | "ETP"  // ETE with all exams, ETP with no midterm
  attendance: number | null
  attendanceMaxMarks: number | null  // Maximum marks for attendance (5 or 15)
  cas: (number | null)[]  // Array to store multiple CAS marks (2, 3, or 4)
  casCount: number  // Number of CAS marks to count (2 or 3)
  casMaxMarks: number | null  // Maximum marks for each CAS
  finalCaMarks: number | null  // Final maximum CA marks to be prorated
  midterm: number | null  // Midterm is null for ETP subjects
  midtermMaxMarks: number | null  // Maximum marks for midterm
  finalExam: number | null
  finalExamMaxMarks: number | null  // Maximum marks for final exam
  grade: string
  gradePoint: number
}

const calculateGradeAndPoints = (
  subjectType: "ETE" | "ETP",
  attendance: number | null,
  attendanceMaxMarks: number | null,
  cas: (number | null)[],
  casCount: number,
  casMaxMarks: number | null,
  finalCaMarks: number | null,
  midterm: number | null,
  midtermMaxMarks: number | null,
  finalExam: number | null,
  finalExamMaxMarks: number | null,
): { grade: string; gradePoint: number } => {
  // If final exam is not provided, we can't determine the final grade
  if (finalExam === null || finalExamMaxMarks === null) {
    return { grade: "Pending", gradePoint: 0.0 }
  }

  // Handle null attendance
  const safeAttendance = attendance !== null ? attendance : 0;

  // Calculate best CAS marks based on the user-selected number to count
  let bestCasTotal = 0;
  if (cas.length > 0) {
    // Filter out null values and sort CAS marks in descending order
    const validCas = cas.filter(mark => mark !== null) as number[];
    const sortedCas = [...validCas].sort((a, b) => b - a);

    // Take the best N marks based on casCount (or all if there are fewer)
    const casToConsider = sortedCas.slice(0, Math.min(casCount, sortedCas.length));

    // Sum the best CAS marks
    bestCasTotal = casToConsider.reduce((sum, mark) => sum + mark, 0);

    // Apply ceiling to decimal values (e.g., 15.1 becomes 16)
    bestCasTotal = Math.ceil(bestCasTotal);
  }

  // Standard maximum marks for components
  const standardCasMax = 30; // Standard max for each CAS (updated from 15 to 30)
  const standardMidtermMax = 20; // Standard max for midterm
  const standardFinalExamMax = 50; // Standard max for final exam
  const standardAttendanceMax = 5; // Standard max for attendance (default to 5)

  // Use provided max marks or defaults
  const safeCasMaxMarks = casMaxMarks !== null && casMaxMarks > 0 ? casMaxMarks : standardCasMax;
  const safeMidtermMaxMarks = midtermMaxMarks !== null && midtermMaxMarks > 0 ? midtermMaxMarks : standardMidtermMax;
  const safeFinalExamMaxMarks = finalExamMaxMarks > 0 ? finalExamMaxMarks : standardFinalExamMax;
  const safeAttendanceMaxMarks = attendanceMaxMarks !== null && attendanceMaxMarks > 0 ? attendanceMaxMarks : standardAttendanceMax;

  // Scale marks if the exam was conducted for different maximum marks
  let scaledCasTotal = bestCasTotal;
  let scaledMidterm = midterm;
  let scaledFinalExam = finalExam;

  // Calculate CA percentage and prorate based on finalCaMarks if provided
  if (finalCaMarks !== null && finalCaMarks > 0) {
    // Calculate CA percentage
    const validCasCount = cas.filter(mark => mark !== null).length;
    if (validCasCount > 0 && safeCasMaxMarks > 0) {
      // Calculate percentage of CA marks obtained
      const caPercentage = (bestCasTotal / (safeCasMaxMarks * validCasCount)) * 100;

      // Prorate based on finalCaMarks
      scaledCasTotal = Math.ceil((caPercentage / 100) * finalCaMarks);
    }
  } 
  // If finalCaMarks is not provided, use the standard scaling
  else if (safeCasMaxMarks !== standardCasMax) {
    // Scale to standard (e.g., if CAS is out of 10 instead of 15)
    const validCasCount = cas.filter(mark => mark !== null).length;
    if (validCasCount > 0) {
      scaledCasTotal = (bestCasTotal / safeCasMaxMarks) * standardCasMax * validCasCount;
      // Apply ceiling to scaled value
      scaledCasTotal = Math.ceil(scaledCasTotal);
    }
  }

  // Scale midterm marks if needed
  if (midterm !== null && safeMidtermMaxMarks !== standardMidtermMax) {
    scaledMidterm = (midterm / safeMidtermMaxMarks) * standardMidtermMax;
    // Apply ceiling to scaled value
    scaledMidterm = Math.ceil(scaledMidterm);
  }

  // Scale final exam marks if needed
  if (safeFinalExamMaxMarks !== standardFinalExamMax) {
    scaledFinalExam = (finalExam / safeFinalExamMaxMarks) * standardFinalExamMax;
    // Apply ceiling to scaled value
    scaledFinalExam = Math.ceil(scaledFinalExam);
  }

  // Scale attendance marks if needed
  let scaledAttendance = safeAttendance;
  if (safeAttendanceMaxMarks !== standardAttendanceMax) {
    // Scale to standard (e.g., if attendance is out of 15 instead of 5)
    if (safeAttendance > 0) {
      scaledAttendance = (safeAttendance / safeAttendanceMaxMarks) * standardAttendanceMax;
      // Apply ceiling to scaled value
      scaledAttendance = Math.ceil(scaledAttendance);
    }
  }

  // Calculate total based on subject type
  let total = 0;
  let maxTotal = 0;

  if (subjectType === "ETE") {
    // For ETE subjects: attendance + best CAS + midterm + final
    total = scaledAttendance + scaledCasTotal + (scaledMidterm !== null ? scaledMidterm : 0) + scaledFinalExam;

    // Max possible total for ETE subjects
    // Attendance (max standardAttendanceMax) + CAS (max standardCasMax * casCount) + Midterm (max 20) + Final (max 50)
    maxTotal = standardAttendanceMax + (standardCasMax * casCount) + standardMidtermMax + standardFinalExamMax;
  } else {
    // For ETP subjects: attendance + best CAS + final (no midterm)
    total = scaledAttendance + scaledCasTotal + scaledFinalExam;

    // Max possible total for ETP subjects
    // Attendance (max standardAttendanceMax) + CAS (max standardCasMax * casCount) + Final (max 50)
    maxTotal = standardAttendanceMax + (standardCasMax * casCount) + standardFinalExamMax;
  }

  // Calculate percentage
  const percentage = (total / maxTotal) * 100;

  // Check pass/fail criteria
  // 1. Final exam must be >= 40% to pass
  const finalExamPercentage = (finalExam / safeFinalExamMaxMarks) * 100;

  // 2. Validate that we have at least one valid CAS mark if casCount > 0
  const validCasCount = cas.filter(mark => mark !== null).length;
  if (casCount > 0 && validCasCount === 0) {
    return { grade: "Incomplete", gradePoint: 0.0 }
  }

  // 3. Validate that we have enough CAS marks to satisfy casCount
  if (validCasCount < casCount) {
    // We'll still calculate a grade, but this is a warning condition
    console.warn(`Not enough valid CAS marks (${validCasCount}) to satisfy casCount (${casCount})`);
  }

  // 4. Overall percentage must be >= 40 to get a grade
  if (finalExamPercentage < 40 || percentage < 40) {
    return { grade: "F", gradePoint: 0.0 }
  }

  // Assign grade based on percentage using the updated grading scale
  // Using Math.round to handle floating point precision issues (e.g., 89.999999% should be treated as 90%)
  const roundedPercentage = Math.round(percentage * 100) / 100;

  if (roundedPercentage >= 90) return { grade: "O", gradePoint: 10.0 }
  if (roundedPercentage >= 80) return { grade: "A+", gradePoint: 9.0 }
  if (roundedPercentage >= 70) return { grade: "A", gradePoint: 8.0 }
  if (roundedPercentage >= 60) return { grade: "B+", gradePoint: 7.0 }
  if (roundedPercentage >= 50) return { grade: "B", gradePoint: 6.0 }
  if (roundedPercentage >= 45) return { grade: "C", gradePoint: 5.0 }
  if (roundedPercentage >= 40) return { grade: "D", gradePoint: 4.0 }

  return { grade: "F", gradePoint: 0.0 }
}

export default function TGPACalculator() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "1",
      code: "CS101",
      name: "Introduction to Programming",
      credits: 4,
      subjectType: "ETE",
      attendance: 5,
      attendanceMaxMarks: 5,  // Default to 5
      cas: [15, 12, 14],
      casCount: 3,
      casMaxMarks: 30,  // Updated from 15 to 30
      finalCaMarks: 40,  // Default to 40 (typical final CA marks)
      midterm: 20,
      midtermMaxMarks: 20,
      finalExam: null,
      finalExamMaxMarks: 50,
      grade: "",
      gradePoint: 0,
    },
  ])

  const [newCourse, setNewCourse] = useState<Omit<Course, "id" | "grade" | "gradePoint">>({
    code: "",
    name: "",
    credits: 3,
    subjectType: "ETE",
    attendance: null,
    attendanceMaxMarks: 5,  // Default to 5
    cas: [null, null, null, null],  // Initialize with 4 CAS marks as null
    casCount: 3,
    casMaxMarks: 30,  // Default to 30 (updated from 15)
    finalCaMarks: null,  // Initialize with null
    midterm: null,
    midtermMaxMarks: null,
    finalExam: null,
    finalExamMaxMarks: null,
  })

  const addCourse = () => {
    const { grade, gradePoint } = calculateGradeAndPoints(
      newCourse.subjectType,
      newCourse.attendance,
      newCourse.attendanceMaxMarks,
      newCourse.cas,
      newCourse.casCount,
      newCourse.casMaxMarks,
      newCourse.finalCaMarks,
      newCourse.midterm,
      newCourse.midtermMaxMarks,
      newCourse.finalExam,
      newCourse.finalExamMaxMarks,
    )

    setCourses([
      ...courses,
      {
        id: Date.now().toString(),
        ...newCourse,
        grade,
        gradePoint,
      },
    ])

    // Reset form
    setNewCourse({
      code: "",
      name: "",
      credits: 3,
      subjectType: "ETE",
      attendance: null,
      attendanceMaxMarks: 5,  // Default to 5
      cas: [null, null, null, null],  // Reset with 4 CAS marks as null
      casCount: 3,
      casMaxMarks: 30,  // Default to 30
      finalCaMarks: null,  // Reset finalCaMarks
      midterm: null,
      midtermMaxMarks: null,
      finalExam: null,
      finalExamMaxMarks: null,
    })
  }

  const removeCourse = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id))
  }

  const updateCourse = (id: string, field: keyof Course, value: any) => {
    setCourses(
      courses.map((course) => {
        if (course.id === id) {
          const updatedCourse = { ...course, [field]: value }

          // Recalculate grade and grade points
          const { grade, gradePoint } = calculateGradeAndPoints(
            updatedCourse.subjectType,
            updatedCourse.attendance,
            updatedCourse.attendanceMaxMarks,
            updatedCourse.cas,
            updatedCourse.casCount,
            updatedCourse.casMaxMarks,
            updatedCourse.finalCaMarks,
            updatedCourse.midterm,
            updatedCourse.midtermMaxMarks,
            updatedCourse.finalExam,
            updatedCourse.finalExamMaxMarks,
          )

          return { ...updatedCourse, grade, gradePoint }
        }
        return course
      }),
    )
  }

  const calculateTGPA = () => {
    if (courses.length === 0) return 0

    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)
    const weightedGradePoints = courses.reduce((sum, course) => sum + course.credits * course.gradePoint, 0)

    return weightedGradePoints / totalCredits
  }

  const tgpa = calculateTGPA()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">TGPA Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Courses</CardTitle>
              <CardDescription>Enter your course details to calculate your Term GPA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Attend Max</TableHead>
                      <TableHead>CAS Marks</TableHead>
                      <TableHead>CAS Count</TableHead>
                      <TableHead>Converted CA</TableHead>
                      <TableHead>CAS Max</TableHead>
                      <TableHead>Final CA Max</TableHead>
                      <TableHead>Midterm</TableHead>
                      <TableHead>Mid Max</TableHead>
                      <TableHead>Final Exam</TableHead>
                      <TableHead>Final Max</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <Input
                            value={course.code}
                            onChange={(e) => updateCourse(course.id, "code", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={course.name}
                            onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={course.credits.toString()}
                            onValueChange={(value) => updateCourse(course.id, "credits", Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Credits" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6].map((credit) => (
                                <SelectItem key={credit} value={credit.toString()}>
                                  {credit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={course.subjectType}
                            onValueChange={(value) => updateCourse(course.id, "subjectType", value as "ETE" | "ETP")}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ETE">ETE (All Exams)</SelectItem>
                              <SelectItem value="ETP">ETP (No Midterm)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={course.attendance === null ? "" : course.attendance}
                            onChange={(e) =>
                              updateCourse(course.id, "attendance", e.target.value === "" ? null : Number.parseInt(e.target.value) || 0)
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={(course.attendanceMaxMarks || 5).toString()}
                            onValueChange={(value) => updateCourse(course.id, "attendanceMaxMarks", Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Max" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {course.cas.map((cas, index) => (
                              <Input
                                key={index}
                                type="number"
                                min="0"
                                max="30"
                                value={cas === null ? "" : cas}
                                onChange={(e) => {
                                  const newCas = [...course.cas];
                                  newCas[index] = e.target.value === "" ? null : Number.parseInt(e.target.value) || 0;
                                  updateCourse(course.id, "cas", newCas);
                                }}
                                className="w-28"
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={course.casCount.toString()}
                            onValueChange={(value) => updateCourse(course.id, "casCount", Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="Count" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Check if we have valid CAS marks and max marks
                            if (course.cas.every(mark => mark === null) || course.casMaxMarks === null) {
                              return "N/A";
                            }

                            // Filter out null values and sort CAS marks in descending order
                            const validCas = course.cas.filter(mark => mark !== null) as number[];
                            const sortedCas = [...validCas].sort((a, b) => b - a);

                            // Take the best N marks based on casCount
                            const casToConsider = sortedCas.slice(0, Math.min(course.casCount, sortedCas.length));

                            // If no valid CAS marks to consider, return N/A
                            if (casToConsider.length === 0) {
                              return "N/A";
                            }

                            // Sum the best CAS marks
                            const bestCasTotal = casToConsider.reduce((sum, mark) => sum + mark, 0);

                            // Calculate converted CA score
                            let convertedCA = bestCasTotal;
                            if (course.casCount === 2) {
                              // For 2 CAS: add marks, divide by 60, multiply by max CA marks, take ceiling
                              convertedCA = Math.ceil((bestCasTotal / 60) * course.casMaxMarks);
                            } else {
                              // For other cases, calculate proportionally
                              const totalPossible = course.casCount * 15; // Assuming each CAS is out of 15
                              convertedCA = Math.ceil((bestCasTotal / totalPossible) * course.casMaxMarks);
                            }

                            return convertedCA;
                          })()}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={course.casMaxMarks === null ? "" : course.casMaxMarks}
                            onChange={(e) =>
                              updateCourse(course.id, "casMaxMarks", e.target.value === "" ? null : Number.parseInt(e.target.value) || null)
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={course.finalCaMarks === null ? "" : course.finalCaMarks}
                            onChange={(e) =>
                              updateCourse(course.id, "finalCaMarks", e.target.value === "" ? null : Number.parseInt(e.target.value) || null)
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          {course.subjectType === "ETE" ? (
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              value={course.midterm === null ? "" : course.midterm}
                              onChange={(e) =>
                                updateCourse(
                                  course.id,
                                  "midterm",
                                  e.target.value === "" ? null : Number.parseInt(e.target.value) || null
                                )
                              }
                              className="w-20"
                            />
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {course.subjectType === "ETE" ? (
                            <Input
                              type="number"
                              min="1"
                              value={course.midtermMaxMarks === null ? "" : course.midtermMaxMarks}
                              onChange={(e) =>
                                updateCourse(course.id, "midtermMaxMarks", e.target.value === "" ? null : Number.parseInt(e.target.value) || null)
                              }
                              className="w-20"
                            />
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={course.finalExam === null ? "" : course.finalExam}
                            onChange={(e) =>
                              updateCourse(
                                course.id,
                                "finalExam",
                                e.target.value === "" ? null : Number.parseInt(e.target.value) || 0,
                              )
                            }
                            placeholder="N/A"
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={course.finalExamMaxMarks === null ? "" : course.finalExamMaxMarks}
                            onChange={(e) =>
                              updateCourse(course.id, "finalExamMaxMarks", e.target.value === "" ? null : Number.parseInt(e.target.value) || null)
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Handle null values
                            if (course.cas.every(mark => mark === null) || 
                                course.casMaxMarks === null || 
                                (course.subjectType === "ETE" && course.midterm === null) || 
                                course.finalExam === null || 
                                course.finalExamMaxMarks === null || 
                                course.attendance === null) {
                              return "Incomplete";
                            }

                            // Calculate converted CA score
                            const validCas = course.cas.filter(mark => mark !== null) as number[];
                            const sortedCas = [...validCas].sort((a, b) => b - a);
                            const casToConsider = sortedCas.slice(0, Math.min(course.casCount, sortedCas.length));
                            const bestCasTotal = casToConsider.reduce((sum, mark) => sum + mark, 0);

                            let convertedCA = bestCasTotal;

                            // If finalCaMarks is provided, use it to prorate the CA percentage
                            if (course.finalCaMarks !== null && course.finalCaMarks > 0 && course.casMaxMarks !== null && casToConsider.length > 0) {
                              // Calculate CA percentage
                              const caPercentage = (bestCasTotal / (course.casMaxMarks * casToConsider.length)) * 100;

                              // Prorate based on finalCaMarks
                              convertedCA = Math.ceil((caPercentage / 100) * course.finalCaMarks);
                            }
                            // Otherwise use the standard conversion
                            else if (course.casMaxMarks !== null) {
                              if (course.casCount === 2) {
                                const totalPossible = 2 * 30; // 2 CAS marks, each out of 30
                                convertedCA = Math.ceil((bestCasTotal / totalPossible) * course.casMaxMarks);
                              } else {
                                const totalPossible = course.casCount * 30; // Each CAS is out of 30 now
                                convertedCA = Math.ceil((bestCasTotal / totalPossible) * course.casMaxMarks);
                              }
                            }

                            // Calculate total marks
                            const safeAttendance = course.attendance !== null ? course.attendance : 0;
                            const midtermMarks = course.subjectType === "ETE" && course.midterm !== null ? course.midterm : 0;
                            const finalExamMarks = course.finalExam !== null ? course.finalExam : 0;
                            const totalMarks = safeAttendance + convertedCA + midtermMarks + finalExamMarks;

                            return totalMarks;
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Handle null values
                            if (course.cas.every(mark => mark === null) || 
                                course.casMaxMarks === null || 
                                (course.subjectType === "ETE" && course.midterm === null) || 
                                course.finalExam === null || 
                                course.finalExamMaxMarks === null || 
                                course.attendance === null) {
                              return "Incomplete";
                            }

                            // Standard maximum marks for components
                            const standardCasMax = 30; // Standard max for each CAS (updated from 15 to 30)
                            const standardMidtermMax = 20; // Standard max for midterm
                            const standardFinalExamMax = 50; // Standard max for final exam
                            const standardAttendanceMax = course.attendanceMaxMarks || 5; // Use course's attendance max marks or default to 5

                            // Calculate max total based on subject type
                            let maxTotal = 0;

                            // If finalCaMarks is provided, use it instead of standardCasMax * casCount
                            const caMaxTotal = course.finalCaMarks !== null && course.finalCaMarks > 0 
                              ? course.finalCaMarks 
                              : standardCasMax * course.casCount;

                            if (course.subjectType === "ETE") {
                              // Max possible total for ETE subjects
                              // Attendance (max standardAttendanceMax) + CA (finalCaMarks or standardCasMax * casCount) + Midterm (max 20) + Final (max 50)
                              maxTotal = standardAttendanceMax + caMaxTotal + standardMidtermMax + standardFinalExamMax;
                            } else {
                              // Max possible total for ETP subjects
                              // Attendance (max standardAttendanceMax) + CA (finalCaMarks or standardCasMax * casCount) + Final (max 50)
                              maxTotal = standardAttendanceMax + caMaxTotal + standardFinalExamMax;
                            }

                            // Calculate converted CA score
                            const validCas = course.cas.filter(mark => mark !== null) as number[];
                            const sortedCas = [...validCas].sort((a, b) => b - a);
                            const casToConsider = sortedCas.slice(0, Math.min(course.casCount, sortedCas.length));
                            const bestCasTotal = casToConsider.reduce((sum, mark) => sum + mark, 0);

                            let convertedCA = bestCasTotal;

                            // If finalCaMarks is provided, use it to prorate the CA percentage
                            if (course.finalCaMarks !== null && course.finalCaMarks > 0 && course.casMaxMarks !== null && casToConsider.length > 0) {
                              // Calculate CA percentage
                              const caPercentage = (bestCasTotal / (course.casMaxMarks * casToConsider.length)) * 100;

                              // Prorate based on finalCaMarks
                              convertedCA = Math.ceil((caPercentage / 100) * course.finalCaMarks);
                            }
                            // Otherwise use the standard conversion
                            else if (course.casMaxMarks !== null) {
                              if (course.casCount === 2) {
                                const totalPossible = 2 * 30; // 2 CAS marks, each out of 30
                                convertedCA = Math.ceil((bestCasTotal / totalPossible) * course.casMaxMarks);
                              } else {
                                const totalPossible = course.casCount * 30; // Each CAS is out of 30 now
                                convertedCA = Math.ceil((bestCasTotal / totalPossible) * course.casMaxMarks);
                              }
                            }

                            // Calculate total marks
                            const safeAttendance = course.attendance !== null ? course.attendance : 0;
                            const midtermMarks = course.subjectType === "ETE" && course.midterm !== null ? course.midterm : 0;
                            const finalExamMarks = course.finalExam !== null ? course.finalExam : 0;
                            const totalMarks = safeAttendance + convertedCA + midtermMarks + finalExamMarks;

                            // Calculate percentage
                            const percentage = (totalMarks / maxTotal) * 100;
                            return percentage.toFixed(2) + "%";
                          })()}
                        </TableCell>
                        <TableCell>{course.grade}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeCourse(course.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <h3 className="font-medium mb-2">Add New Course</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="code">Course Code</Label>
                    <Input
                      id="code"
                      value={newCourse.code}
                      onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                      placeholder="e.g., CS101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Course Name</Label>
                    <Input
                      id="name"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      placeholder="e.g., Introduction to Programming"
                    />
                  </div>
                  <div>
                    <Label htmlFor="credits">Credits</Label>
                    <Select
                      value={newCourse.credits.toString()}
                      onValueChange={(value) => setNewCourse({ ...newCourse, credits: Number.parseInt(value) })}
                    >
                      <SelectTrigger id="credits">
                        <SelectValue placeholder="Credits" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((credit) => (
                          <SelectItem key={credit} value={credit.toString()}>
                            {credit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subjectType">Subject Type</Label>
                    <Select
                      value={newCourse.subjectType}
                      onValueChange={(value) => {
                        // If changing from ETE to ETP, set midterm to null
                        if (value === "ETP") {
                          setNewCourse({ ...newCourse, subjectType: value as "ETE" | "ETP", midterm: null });
                        } else {
                          setNewCourse({ ...newCourse, subjectType: value as "ETE" | "ETP" });
                        }
                      }}
                    >
                      <SelectTrigger id="subjectType">
                        <SelectValue placeholder="Subject Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETE">ETE (All Exams)</SelectItem>
                        <SelectItem value="ETP">ETP (No Midterm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="attendance">Attendance</Label>
                      <Select
                        value={newCourse.attendance === null ? "none" : newCourse.attendance.toString()}
                        onValueChange={(value) => setNewCourse({ ...newCourse, attendance: value === "none" ? null : Number.parseInt(value) })}
                      >
                        <SelectTrigger id="attendance">
                          <SelectValue placeholder="Attendance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select attendance</SelectItem>
                          <SelectItem value="0">Below 75%</SelectItem>
                          <SelectItem value="2">75% - 79%</SelectItem>
                          <SelectItem value="3">80% - 84%</SelectItem>
                          <SelectItem value="4">85% - 89%</SelectItem>
                          <SelectItem value="5">90% - 94%</SelectItem>
                          <SelectItem value="6">95% - 100%</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select your attendance percentage to calculate attendance marks.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="attendanceMaxMarks">Attendance Max Marks</Label>
                      <Select
                        value={newCourse.attendanceMaxMarks?.toString() || "5"}
                        onValueChange={(value) => setNewCourse({ ...newCourse, attendanceMaxMarks: Number.parseInt(value) })}
                      >
                        <SelectTrigger id="attendanceMaxMarks">
                          <SelectValue placeholder="Max Marks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Marks</SelectItem>
                          <SelectItem value="15">15 Marks</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select the maximum marks for attendance (5 or 15).
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="casCount">Number of CAS</Label>
                      <Select
                        value={newCourse.cas.length.toString()}
                        onValueChange={(value) => {
                          const count = Number.parseInt(value);
                          // Create a new array with the specified length, preserving existing values
                          const newCas = Array(count).fill(null).map((_, i) => 
                            i < newCourse.cas.length ? newCourse.cas[i] : null
                          );
                          setNewCourse({ ...newCourse, cas: newCas });
                        }}
                      >
                        <SelectTrigger id="casCount">
                          <SelectValue placeholder="Number of CAS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select how many CA tests were conducted for this course.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="casCountUsed">CAS Marks to Count</Label>
                      <Select
                        value={newCourse.casCount.toString()}
                        onValueChange={(value) => {
                          setNewCourse({ ...newCourse, casCount: Number.parseInt(value) });
                        }}
                      >
                        <SelectTrigger id="casCountUsed">
                          <SelectValue placeholder="CAS to Count" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">Best 2</SelectItem>
                          <SelectItem value="3">Best 3</SelectItem>
                          <SelectItem value="4">All 4</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select how many of your best CA marks should be counted.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CAS Marks</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {newCourse.cas.map((cas, index) => (
                          <Input
                            key={index}
                            type="number"
                            min="0"
                            max="30"
                            value={cas === null ? "" : cas}
                            onChange={(e) => {
                              const newCas = [...newCourse.cas];
                              newCas[index] = e.target.value === "" ? null : Number.parseInt(e.target.value) || null;
                              setNewCourse({ ...newCourse, cas: newCas });
                            }}
                            placeholder={`CAS ${index + 1}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your Continuous Assessment marks. Leave empty if not applicable.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="casMaxMarks">CAS Max Marks</Label>
                      <Input
                        id="casMaxMarks"
                        type="number"
                        min="1"
                        value={newCourse.casMaxMarks === null ? "" : newCourse.casMaxMarks}
                        onChange={(e) => 
                          setNewCourse({ 
                            ...newCourse, 
                            casMaxMarks: e.target.value === "" ? null : Number.parseInt(e.target.value) || null 
                          })
                        }
                        placeholder="Max marks for each CAS"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the maximum possible marks for each CA test (typically 30).
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="finalCaMarks">Final CA Marks</Label>
                      <Input
                        id="finalCaMarks"
                        type="number"
                        min="1"
                        value={newCourse.finalCaMarks === null ? "" : newCourse.finalCaMarks}
                        onChange={(e) => 
                          setNewCourse({ 
                            ...newCourse, 
                            finalCaMarks: e.target.value === "" ? null : Number.parseInt(e.target.value) || null 
                          })
                        }
                        placeholder="Final max CA marks"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the final maximum CA marks that the calculated percentage from CA marks will be prorated to (typically 40).
                      </p>
                    </div>
                  </div>
                  <div className="border p-3 rounded-md bg-muted/50">
                    <Label className="mb-2 block">CAS Calculation Preview</Label>
                    <div className="text-sm space-y-1">
                      {(() => {
                        // Check if we have valid CAS marks and max marks
                        if (newCourse.cas.every(mark => mark === null) || newCourse.casMaxMarks === null) {
                          return (
                            <p>Please enter CAS marks and max marks to see calculation preview.</p>
                          );
                        }

                        // Filter out null values and sort CAS marks in descending order
                        const validCas = newCourse.cas.filter(mark => mark !== null) as number[];
                        const sortedCas = [...validCas].sort((a, b) => b - a);

                        // Take the best N marks based on casCount (or all if there are fewer)
                        const casToConsider = sortedCas.slice(0, Math.min(newCourse.casCount, sortedCas.length));

                        // Sum the best CAS marks
                        const bestCasTotal = casToConsider.length > 0 
                          ? Math.ceil(casToConsider.reduce((sum, mark) => sum + mark, 0))
                          : 0;

                        // Calculate scaled CAS total if needed
                        const standardCasMax = 30;  // Updated from 15 to 30
                        let scaledCasTotal = bestCasTotal;

                        if (newCourse.casMaxMarks !== standardCasMax && newCourse.casMaxMarks > 0) {
                          // Scale to standard (e.g., if CAS is out of 10 instead of 30)
                          scaledCasTotal = Math.ceil((bestCasTotal / newCourse.casMaxMarks) * standardCasMax * casToConsider.length);
                        }

                        // Format CAS marks for display, replacing null with 'N/A'
                        const formattedCasMarks = newCourse.cas.map(mark => mark === null ? 'N/A' : mark).join(', ');
                        const formattedSelectedMarks = casToConsider.join(', ') || 'None';

                        return (
                          <>
                            <p><strong>CAS Marks:</strong> {formattedCasMarks}</p>
                            <p><strong>Considering:</strong> {newCourse.casCount === 4 ? 'All 4' : `Best ${newCourse.casCount}`} CAS marks</p>
                            <p><strong>Selected CAS Marks:</strong> {formattedSelectedMarks}</p>
                            <p><strong>Total CAS Marks:</strong> {bestCasTotal} out of {newCourse.casMaxMarks * casToConsider.length}</p>

                            {/* Calculate and display converted CA score */}
                            {(() => {
                              if (casToConsider.length === 0 || newCourse.casMaxMarks === null) {
                                return <p><strong>Converted CA Score:</strong> Cannot calculate (missing data)</p>;
                              }

                              let convertedCA = bestCasTotal;
                              if (newCourse.casCount === 2) {
                                // For 2 CAS: add marks, divide by total possible (2 * 30 = 60), multiply by max CA marks, take ceiling
                                const totalPossible = 2 * 30; // 2 CAS marks, each out of 30
                                convertedCA = Math.ceil((bestCasTotal / totalPossible) * newCourse.casMaxMarks);
                                return (
                                  <p><strong>Converted CA Score:</strong> {convertedCA} (calculated as: ceil({bestCasTotal}/{totalPossible} × {newCourse.casMaxMarks}))</p>
                                );
                              } else {
                                // For other cases, calculate proportionally
                                const totalPossible = newCourse.casCount * 30; // Each CAS is out of 30 now
                                convertedCA = Math.ceil((bestCasTotal / totalPossible) * newCourse.casMaxMarks);
                                return (
                                  <p><strong>Converted CA Score:</strong> {convertedCA} (calculated as: ceil({bestCasTotal}/{totalPossible} × {newCourse.casMaxMarks}))</p>
                                );
                              }
                            })()}

                            {newCourse.casMaxMarks !== standardCasMax && newCourse.casMaxMarks > 0 && (
                              <p><strong>Scaled CAS Marks:</strong> {scaledCasTotal} (scaled to standard)</p>
                            )}

                            {/* Show prorated CA marks based on finalCaMarks if provided */}
                            {newCourse.finalCaMarks !== null && newCourse.finalCaMarks > 0 && casToConsider.length > 0 && newCourse.casMaxMarks !== null && (
                              (() => {
                                // Calculate CA percentage
                                const caPercentage = (bestCasTotal / (newCourse.casMaxMarks * casToConsider.length)) * 100;

                                // Prorate based on finalCaMarks
                                const proratedCaMarks = Math.ceil((caPercentage / 100) * newCourse.finalCaMarks);

                                return (
                                  <>
                                    <p><strong>CA Percentage:</strong> {caPercentage.toFixed(2)}%</p>
                                    <p><strong>Prorated CA Marks:</strong> {proratedCaMarks} out of {newCourse.finalCaMarks} (calculated as: ceil({caPercentage.toFixed(2)}% × {newCourse.finalCaMarks}))</p>
                                  </>
                                );
                              })()
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {newCourse.subjectType === "ETE" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="midterm">Midterm</Label>
                        <Input
                          id="midterm"
                          type="number"
                          min="0"
                          max="20"
                          value={newCourse.midterm === null ? "" : newCourse.midterm}
                          onChange={(e) => 
                            setNewCourse({ 
                              ...newCourse, 
                              midterm: e.target.value === "" ? null : Number.parseInt(e.target.value) || null 
                            })
                          }
                          placeholder="Midterm marks"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter your midterm exam marks. Leave empty if not applicable.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="midtermMaxMarks">Midterm Max Marks</Label>
                        <Input
                          id="midtermMaxMarks"
                          type="number"
                          min="1"
                          value={newCourse.midtermMaxMarks === null ? "" : newCourse.midtermMaxMarks}
                          onChange={(e) => 
                            setNewCourse({ 
                              ...newCourse, 
                              midtermMaxMarks: e.target.value === "" ? null : Number.parseInt(e.target.value) || null 
                            })
                          }
                          placeholder="Max marks for midterm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter the maximum possible marks for midterm (typically 20).
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="finalExam">Final Exam</Label>
                      <Input
                        id="finalExam"
                        type="number"
                        min="0"
                        value={newCourse.finalExam === null ? "" : newCourse.finalExam}
                        onChange={(e) => 
                          setNewCourse({ 
                            ...newCourse, 
                            finalExam: e.target.value === "" ? null : Number.parseInt(e.target.value) || null 
                          })
                        }
                        placeholder="Final exam marks"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter your final exam marks. Leave empty if not yet taken.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="finalExamMaxMarks">Final Exam Max Marks</Label>
                      <Input
                        id="finalExamMaxMarks"
                        type="number"
                        min="1"
                        value={newCourse.finalExamMaxMarks === null ? "" : newCourse.finalExamMaxMarks}
                        onChange={(e) => 
                          setNewCourse({ 
                            ...newCourse, 
                            finalExamMaxMarks: e.target.value === "" ? null : Number.parseInt(e.target.value) || null 
                          })
                        }
                        placeholder="Max marks for final exam"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the maximum possible marks for final exam (typically 50).
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addCourse} disabled={!newCourse.code || !newCourse.name} className="flex-1">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Course
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setNewCourse({
                        code: "",
                        name: "",
                        credits: 3,
                        subjectType: "ETE",
                        attendance: null,
                        attendanceMaxMarks: 5,  // Default to 5
                        cas: [null, null, null, null],
                        casCount: 3,
                        casMaxMarks: 30,  // Default to 30
                        finalCaMarks: null,  // Reset finalCaMarks
                        midterm: null,
                        midtermMaxMarks: null,
                        finalExam: null,
                        finalExamMaxMarks: null,
                      });
                    }}
                    className="w-1/4"
                  >
                    Clear Form
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>TGPA Summary</CardTitle>
              <CardDescription>Your calculated Term GPA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{tgpa.toFixed(2)}</div>
                <p className="text-sm font-medium">Out of 10.0</p>
                <p className="text-muted-foreground mt-2">
                  Based on {courses.length} course{courses.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-2">Grade Distribution</h3>
                <div className="space-y-2">
                  {["O", "A+", "A", "B+", "B", "C", "D", "F"].map((grade) => {
                    const count = courses.filter((c) => c.grade === grade).length
                    if (count === 0) return null

                    return (
                      <div key={grade} className="flex justify-between">
                        <span>{grade}:</span>
                        <span>
                          {count} course{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
