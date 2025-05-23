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
  attendance: number
  cas: number[]  // Array to store multiple CAS marks (2, 3, or 4)
  casCount: number  // Number of CAS marks to count (2 or 3)
  casMaxMarks: number  // Maximum marks for each CAS (default 15)
  midterm: number | null  // Midterm is null for ETP subjects
  midtermMaxMarks: number  // Maximum marks for midterm (default 20)
  finalExam: number | null
  finalExamMaxMarks: number  // Maximum marks for final exam (default 50)
  grade: string
  gradePoint: number
}

const calculateGradeAndPoints = (
  subjectType: "ETE" | "ETP",
  attendance: number,
  cas: number[],
  casCount: number,
  casMaxMarks: number,
  midterm: number | null,
  midtermMaxMarks: number,
  finalExam: number | null,
  finalExamMaxMarks: number,
): { grade: string; gradePoint: number } => {
  // If final exam is not provided, we can't determine the final grade
  if (finalExam === null) {
    return { grade: "Pending", gradePoint: 0.0 }
  }

  // Calculate best CAS marks based on the user-selected number to count
  let bestCasTotal = 0
  if (cas.length > 0) {
    // Sort CAS marks in descending order
    const sortedCas = [...cas].sort((a, b) => b - a)

    // Take the best N marks based on casCount (or all if there are fewer)
    const casToConsider = sortedCas.slice(0, Math.min(casCount, cas.length))

    // Sum the best CAS marks
    bestCasTotal = casToConsider.reduce((sum, mark) => sum + mark, 0)

    // Apply ceiling to decimal values (e.g., 15.1 becomes 16)
    bestCasTotal = Math.ceil(bestCasTotal)
  }

  // Standard maximum marks for components
  const standardCasMax = 15; // Standard max for each CAS
  const standardMidtermMax = 20; // Standard max for midterm
  const standardFinalExamMax = 50; // Standard max for final exam

  // Scale marks if the exam was conducted for different maximum marks
  let scaledCasTotal = bestCasTotal;
  let scaledMidterm = midterm;
  let scaledFinalExam = finalExam;

  // Scale CAS marks if needed
  if (casMaxMarks !== standardCasMax && casMaxMarks > 0) {
    // Scale to standard (e.g., if CAS is out of 10 instead of 15)
    scaledCasTotal = (bestCasTotal / casMaxMarks) * standardCasMax * cas.length;
    // Apply ceiling to scaled value
    scaledCasTotal = Math.ceil(scaledCasTotal);
  }

  // Scale midterm marks if needed
  if (midterm !== null && midtermMaxMarks !== standardMidtermMax && midtermMaxMarks > 0) {
    scaledMidterm = (midterm / midtermMaxMarks) * standardMidtermMax;
    // Apply ceiling to scaled value
    scaledMidterm = Math.ceil(scaledMidterm);
  }

  // Scale final exam marks if needed
  if (finalExamMaxMarks !== standardFinalExamMax && finalExamMaxMarks > 0) {
    scaledFinalExam = (finalExam / finalExamMaxMarks) * standardFinalExamMax;
    // Apply ceiling to scaled value
    scaledFinalExam = Math.ceil(scaledFinalExam);
  }

  // Calculate total based on subject type
  let total = 0;
  let maxTotal = 0;

  if (subjectType === "ETE") {
    // For FE subjects: attendance + best CAS + midterm + final
    total = attendance + scaledCasTotal + (scaledMidterm || 0) + scaledFinalExam;

    // Max possible total for FE subjects
    // Attendance (max 6) + CAS (max 45 for best 3) + Midterm (max 20) + Final (max 50)
    maxTotal = 6 + (standardCasMax * 3) + standardMidtermMax + standardFinalExamMax;
  } else {
    // For FW subjects: attendance + best CAS + final (no midterm)
    total = attendance + scaledCasTotal + scaledFinalExam;

    // Max possible total for FW subjects
    // Attendance (max 6) + CAS (max 45 for best 3) + Final (max 50)
    maxTotal = 6 + (standardCasMax * 3) + standardFinalExamMax;
  }

  // Calculate percentage
  const percentage = (total / maxTotal) * 100;

  // Check pass/fail criteria
  // 1. Final exam must be >= 40% to pass
  const finalExamPercentage = (finalExam / finalExamMaxMarks) * 100;

  // 2. Overall percentage must be >= 40 to get a grade
  if (finalExamPercentage < 40 || percentage < 40) {
    return { grade: "F", gradePoint: 0.0 }
  }

  // Assign grade based on percentage using the new grading scale
  if (percentage >= 90) return { grade: "O", gradePoint: 10.0 }
  if (percentage >= 80) return { grade: "A+", gradePoint: 9.0 }
  if (percentage >= 70) return { grade: "A", gradePoint: 8.0 }
  if (percentage >= 60) return { grade: "B+", gradePoint: 7.0 }
  if (percentage >= 50) return { grade: "B", gradePoint: 6.0 }
  if (percentage >= 45) return { grade: "C", gradePoint: 5.0 }
  if (percentage >= 40) return { grade: "D", gradePoint: 4.0 }

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
      cas: [15, 12, 14],
      casCount: 3,
      casMaxMarks: 15,
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
    attendance: 0,
    cas: [0, 0, 0, 0],  // Initialize with 4 CAS marks
    casCount: 3,
    casMaxMarks: 15,
    midterm: 0,
    midtermMaxMarks: 20,
    finalExam: null,
    finalExamMaxMarks: 50,
  })

  const addCourse = () => {
    const { grade, gradePoint } = calculateGradeAndPoints(
      newCourse.subjectType,
      newCourse.attendance,
      newCourse.cas,
      newCourse.casCount,
      newCourse.casMaxMarks,
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
      attendance: 0,
      cas: [0, 0, 0, 0],  // Reset with 4 CAS marks
      casCount: 3,
      casMaxMarks: 15,
      midterm: 0,
      midtermMaxMarks: 20,
      finalExam: null,
      finalExamMaxMarks: 50,
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
            updatedCourse.cas,
            updatedCourse.casCount,
            updatedCourse.casMaxMarks,
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
                      <TableHead>CAS Marks</TableHead>
                      <TableHead>CAS Count</TableHead>
                      <TableHead>Converted CA</TableHead>
                      <TableHead>CAS Max</TableHead>
                      <TableHead>Midterm</TableHead>
                      <TableHead>Mid Max</TableHead>
                      <TableHead>Final Exam</TableHead>
                      <TableHead>Final Max</TableHead>
                      <TableHead>Total Marks</TableHead>
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
                            onValueChange={(value) => updateCourse(course.id, "subjectType", value as "FE" | "FW")}
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
                            value={course.attendance}
                            onChange={(e) =>
                              updateCourse(course.id, "attendance", Number.parseInt(e.target.value) || 0)
                            }
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {course.cas.map((cas, index) => (
                              <Input
                                key={index}
                                type="number"
                                min="0"
                                max="15"
                                value={cas}
                                onChange={(e) => {
                                  const newCas = [...course.cas];
                                  newCas[index] = Number.parseInt(e.target.value) || 0;
                                  updateCourse(course.id, "cas", newCas);
                                }}
                                className="w-16"
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={course.casCount.toString()}
                            onValueChange={(value) => updateCourse(course.id, "casCount", Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-16">
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
                            // Sort CAS marks in descending order
                            const sortedCas = [...course.cas].sort((a, b) => b - a);

                            // Take the best N marks based on casCount
                            const casToConsider = sortedCas.slice(0, Math.min(course.casCount, course.cas.length));

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
                            value={course.casMaxMarks}
                            onChange={(e) =>
                              updateCourse(course.id, "casMaxMarks", Number.parseInt(e.target.value) || 15)
                            }
                            className="w-16"
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
                                  e.target.value === "" ? null : Number.parseInt(e.target.value) || 0
                                )
                              }
                              className="w-16"
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
                              value={course.midtermMaxMarks}
                              onChange={(e) =>
                                updateCourse(course.id, "midtermMaxMarks", Number.parseInt(e.target.value) || 20)
                              }
                              className="w-16"
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
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={course.finalExamMaxMarks}
                            onChange={(e) =>
                              updateCourse(course.id, "finalExamMaxMarks", Number.parseInt(e.target.value) || 50)
                            }
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Calculate converted CA score
                            const sortedCas = [...course.cas].sort((a, b) => b - a);
                            const casToConsider = sortedCas.slice(0, Math.min(course.casCount, course.cas.length));
                            const bestCasTotal = casToConsider.reduce((sum, mark) => sum + mark, 0);

                            let convertedCA = bestCasTotal;
                            if (course.casCount === 2) {
                              convertedCA = Math.ceil((bestCasTotal / 60) * course.casMaxMarks);
                            } else {
                              const totalPossible = course.casCount * 15;
                              convertedCA = Math.ceil((bestCasTotal / totalPossible) * course.casMaxMarks);
                            }

                            // Calculate total marks
                            const midtermMarks = course.subjectType === "ETE" && course.midterm !== null ? course.midterm : 0;
                            const finalExamMarks = course.finalExam !== null ? course.finalExam : 0;
                            const totalMarks = course.attendance + convertedCA + midtermMarks + finalExamMarks;

                            return totalMarks;
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
                  <div>
                    <Label htmlFor="attendance">Attendance</Label>
                    <Select
                      value={newCourse.attendance.toString()}
                      onValueChange={(value) => setNewCourse({ ...newCourse, attendance: Number.parseInt(value) })}
                    >
                      <SelectTrigger id="attendance">
                        <SelectValue placeholder="Attendance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Below 75%</SelectItem>
                        <SelectItem value="2">75% - 79%</SelectItem>
                        <SelectItem value="3">80% - 84%</SelectItem>
                        <SelectItem value="4">85% - 89%</SelectItem>
                        <SelectItem value="5">90% - 94%</SelectItem>
                        <SelectItem value="6">95% - 100%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="casCount">Number of CAS</Label>
                      <Select
                        value={newCourse.cas.length.toString()}
                        onValueChange={(value) => {
                          const count = Number.parseInt(value);
                          // Create a new array with the specified length, preserving existing values
                          const newCas = Array(count).fill(0).map((_, i) => 
                            i < newCourse.cas.length ? newCourse.cas[i] : 0
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
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CAS Marks</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {newCourse.cas.map((cas, index) => (
                          <Input
                            key={index}
                            type="number"
                            min="0"
                            max="15"
                            value={cas}
                            onChange={(e) => {
                              const newCas = [...newCourse.cas];
                              newCas[index] = Number.parseInt(e.target.value) || 0;
                              setNewCourse({ ...newCourse, cas: newCas });
                            }}
                            placeholder={`CAS ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="casMaxMarks">CAS Max Marks</Label>
                      <Input
                        id="casMaxMarks"
                        type="number"
                        min="1"
                        value={newCourse.casMaxMarks}
                        onChange={(e) => 
                          setNewCourse({ 
                            ...newCourse, 
                            casMaxMarks: Number.parseInt(e.target.value) || 15 
                          })
                        }
                        placeholder="Max marks for each CAS"
                      />
                    </div>
                  </div>
                  <div className="border p-3 rounded-md bg-muted/50">
                    <Label className="mb-2 block">CAS Calculation Preview</Label>
                    <div className="text-sm space-y-1">
                      {(() => {
                        // Sort CAS marks in descending order
                        const sortedCas = [...newCourse.cas].sort((a, b) => b - a);

                        // Take the best N marks based on casCount (or all if there are fewer)
                        const casToConsider = sortedCas.slice(0, Math.min(newCourse.casCount, newCourse.cas.length));

                        // Sum the best CAS marks
                        const bestCasTotal = Math.ceil(casToConsider.reduce((sum, mark) => sum + mark, 0));

                        // Calculate scaled CAS total if needed
                        const standardCasMax = 15;
                        let scaledCasTotal = bestCasTotal;

                        if (newCourse.casMaxMarks !== standardCasMax && newCourse.casMaxMarks > 0) {
                          // Scale to standard (e.g., if CAS is out of 10 instead of 15)
                          scaledCasTotal = Math.ceil((bestCasTotal / newCourse.casMaxMarks) * standardCasMax * casToConsider.length);
                        }

                        return (
                          <>
                            <p><strong>CAS Marks:</strong> {newCourse.cas.join(', ')}</p>
                            <p><strong>Considering:</strong> {newCourse.casCount === 4 ? 'All 4' : `Best ${newCourse.casCount}`} CAS marks</p>
                            <p><strong>Selected CAS Marks:</strong> {casToConsider.join(', ')}</p>
                            <p><strong>Total CAS Marks:</strong> {bestCasTotal} out of {newCourse.casMaxMarks * casToConsider.length}</p>

                            {/* Calculate and display converted CA score */}
                            {(() => {
                              let convertedCA = bestCasTotal;
                              if (newCourse.casCount === 2) {
                                // For 2 CAS: add marks, divide by 60, multiply by max CA marks, take ceiling
                                convertedCA = Math.ceil((bestCasTotal / 60) * newCourse.casMaxMarks);
                                return (
                                  <p><strong>Converted CA Score:</strong> {convertedCA} (calculated as: ceil({bestCasTotal}/60 × {newCourse.casMaxMarks}))</p>
                                );
                              } else {
                                // For other cases, calculate proportionally
                                const totalPossible = newCourse.casCount * 15;
                                convertedCA = Math.ceil((bestCasTotal / totalPossible) * newCourse.casMaxMarks);
                                return (
                                  <p><strong>Converted CA Score:</strong> {convertedCA} (calculated as: ceil({bestCasTotal}/{totalPossible} × {newCourse.casMaxMarks}))</p>
                                );
                              }
                            })()}

                            {newCourse.casMaxMarks !== standardCasMax && (
                              <p><strong>Scaled CAS Marks:</strong> {scaledCasTotal} (scaled to standard)</p>
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
                              midterm: e.target.value === "" ? null : Number.parseInt(e.target.value) || 0 
                            })
                          }
                          placeholder="Midterm marks"
                        />
                      </div>
                      <div>
                        <Label htmlFor="midtermMaxMarks">Midterm Max Marks</Label>
                        <Input
                          id="midtermMaxMarks"
                          type="number"
                          min="1"
                          value={newCourse.midtermMaxMarks}
                          onChange={(e) => 
                            setNewCourse({ 
                              ...newCourse, 
                              midtermMaxMarks: Number.parseInt(e.target.value) || 20 
                            })
                          }
                          placeholder="Max marks for midterm"
                        />
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
                            finalExam: e.target.value === "" ? null : Number.parseInt(e.target.value) || 0 
                          })
                        }
                        placeholder="Final exam marks"
                      />
                    </div>
                    <div>
                      <Label htmlFor="finalExamMaxMarks">Final Exam Max Marks</Label>
                      <Input
                        id="finalExamMaxMarks"
                        type="number"
                        min="1"
                        value={newCourse.finalExamMaxMarks}
                        onChange={(e) => 
                          setNewCourse({ 
                            ...newCourse, 
                            finalExamMaxMarks: Number.parseInt(e.target.value) || 50 
                          })
                        }
                        placeholder="Max marks for final exam"
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={addCourse} disabled={!newCourse.code || !newCourse.name} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
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
