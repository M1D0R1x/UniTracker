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
  attendance: number
  ca: number
  midterm: number
  finalExam: number | null
  grade: string
  gradePoint: number
}

const calculateGradeAndPoints = (
  attendance: number,
  ca: number,
  midterm: number,
  finalExam: number | null,
): { grade: string; gradePoint: number } => {
  // If final exam is not provided, calculate based on current marks
  if (finalExam === null) {
    const currentTotal = attendance + ca + midterm
    const maxPossibleTotal = currentTotal + 50 // Assuming final exam is worth 50 points

    // Calculate possible grade ranges
    if (maxPossibleTotal >= 90) return { grade: "A to A+", gradePoint: 4.0 }
    if (maxPossibleTotal >= 80) return { grade: "A- to A", gradePoint: 3.7 }
    if (maxPossibleTotal >= 70) return { grade: "B to B+", gradePoint: 3.3 }
    if (maxPossibleTotal >= 60) return { grade: "B- to C+", gradePoint: 2.7 }
    if (maxPossibleTotal >= 50) return { grade: "C to C-", gradePoint: 2.0 }
    return { grade: "D or F", gradePoint: 0.0 }
  }

  // If final exam is provided, calculate actual grade
  const total = attendance + ca + midterm + finalExam

  if (total >= 90) return { grade: "A+", gradePoint: 4.0 }
  if (total >= 85) return { grade: "A", gradePoint: 4.0 }
  if (total >= 80) return { grade: "A-", gradePoint: 3.7 }
  if (total >= 75) return { grade: "B+", gradePoint: 3.3 }
  if (total >= 70) return { grade: "B", gradePoint: 3.0 }
  if (total >= 65) return { grade: "B-", gradePoint: 2.7 }
  if (total >= 60) return { grade: "C+", gradePoint: 2.3 }
  if (total >= 55) return { grade: "C", gradePoint: 2.0 }
  if (total >= 50) return { grade: "C-", gradePoint: 1.7 }
  if (total >= 45) return { grade: "D+", gradePoint: 1.3 }
  if (total >= 40) return { grade: "D", gradePoint: 1.0 }
  return { grade: "F", gradePoint: 0.0 }
}

export default function TGPACalculator() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: "1",
      code: "CS101",
      name: "Introduction to Programming",
      credits: 4,
      attendance: 10,
      ca: 15,
      midterm: 20,
      finalExam: null,
      grade: "",
      gradePoint: 0,
    },
  ])

  const [newCourse, setNewCourse] = useState<Omit<Course, "id" | "grade" | "gradePoint">>({
    code: "",
    name: "",
    credits: 3,
    attendance: 0,
    ca: 0,
    midterm: 0,
    finalExam: null,
  })

  const addCourse = () => {
    const { grade, gradePoint } = calculateGradeAndPoints(
      newCourse.attendance,
      newCourse.ca,
      newCourse.midterm,
      newCourse.finalExam,
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
      attendance: 0,
      ca: 0,
      midterm: 0,
      finalExam: null,
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
            updatedCourse.attendance,
            updatedCourse.ca,
            updatedCourse.midterm,
            updatedCourse.finalExam,
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
                      <TableHead>Attendance</TableHead>
                      <TableHead>CA</TableHead>
                      <TableHead>Midterm</TableHead>
                      <TableHead>Final Exam</TableHead>
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
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={course.ca}
                            onChange={(e) => updateCourse(course.id, "ca", Number.parseInt(e.target.value) || 0)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={course.midterm}
                            onChange={(e) => updateCourse(course.id, "midterm", Number.parseInt(e.target.value) || 0)}
                            className="w-16"
                          />
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
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="attendance">Attendance</Label>
                      <Input
                        id="attendance"
                        type="number"
                        min="0"
                        max="10"
                        value={newCourse.attendance}
                        onChange={(e) =>
                          setNewCourse({ ...newCourse, attendance: Number.parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ca">CA</Label>
                      <Input
                        id="ca"
                        type="number"
                        min="0"
                        max="20"
                        value={newCourse.ca}
                        onChange={(e) => setNewCourse({ ...newCourse, ca: Number.parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="midterm">Midterm</Label>
                      <Input
                        id="midterm"
                        type="number"
                        min="0"
                        max="20"
                        value={newCourse.midterm}
                        onChange={(e) => setNewCourse({ ...newCourse, midterm: Number.parseInt(e.target.value) || 0 })}
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
                <p className="text-muted-foreground">
                  Based on {courses.length} course{courses.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-2">Grade Distribution</h3>
                <div className="space-y-2">
                  {["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"].map((grade) => {
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
