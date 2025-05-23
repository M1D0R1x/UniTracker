"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, PlusCircle, FileDown, FileUp } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Course {
  id: string
  code: string
  name: string
  credits: number
  term: string
}

export default function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [terms, setTerms] = useState<string[]>(["Semester 1", "Semester 2"])
  const [newTerm, setNewTerm] = useState("")

  const [newCourse, setNewCourse] = useState<Omit<Course, "id">>({
    code: "",
    name: "",
    credits: 3,
    term: terms[0] || "",
  })

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedCourses = localStorage.getItem("courses")
    const savedTerms = localStorage.getItem("terms")

    if (savedCourses) {
      setCourses(JSON.parse(savedCourses))
    }

    if (savedTerms) {
      setTerms(JSON.parse(savedTerms))
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("courses", JSON.stringify(courses))
  }, [courses])

  useEffect(() => {
    localStorage.setItem("terms", JSON.stringify(terms))
  }, [terms])

  const addCourse = () => {
    setCourses([
      ...courses,
      {
        id: Date.now().toString(),
        ...newCourse,
      },
    ])

    // Reset form
    setNewCourse({
      code: "",
      name: "",
      credits: 3,
      term: newCourse.term,
    })
  }

  const removeCourse = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id))
  }

  const updateCourse = (id: string, field: keyof Course, value: any) => {
    setCourses(
      courses.map((course) => {
        if (course.id === id) {
          return { ...course, [field]: value }
        }
        return course
      }),
    )
  }

  const addTerm = () => {
    if (newTerm && !terms.includes(newTerm)) {
      setTerms([...terms, newTerm])
      setNewTerm("")
    }
  }

  const removeTerm = (term: string) => {
    setTerms(terms.filter((t) => t !== term))
    // Update courses that were in this term
    setCourses(
      courses.map((course) => {
        if (course.term === term) {
          return { ...course, term: terms[0] || "" }
        }
        return course
      }),
    )
  }

  const exportData = () => {
    const data = {
      courses,
      terms,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gpa-predictor-data.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.courses && Array.isArray(data.courses)) {
          setCourses(data.courses)
        }
        if (data.terms && Array.isArray(data.terms)) {
          setTerms(data.terms)
        }
      } catch (error) {
        console.error("Error importing data:", error)
        alert("Invalid data format")
      }
    }
    reader.readAsText(file)

    // Reset the input
    event.target.value = ""
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Course Manager</h1>

      <div className="flex justify-end mb-4 gap-2">
        <Button onClick={exportData} variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Export Data
        </Button>
        <div className="relative">
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={importData}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="outline">
            <FileUp className="mr-2 h-4 w-4" />
            Import Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="mb-4">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Course List</CardTitle>
              <CardDescription>Manage your courses and their details</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <Input value={course.code} onChange={(e) => updateCourse(course.id, "code", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input value={course.name} onChange={(e) => updateCourse(course.id, "name", e.target.value)} />
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
                        <Select value={course.term} onValueChange={(value) => updateCourse(course.id, "term", value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select Term" />
                          </SelectTrigger>
                          <SelectContent>
                            {terms.map((term) => (
                              <SelectItem key={term} value={term}>
                                {term}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeCourse(course.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <h3 className="font-medium mb-2">Add New Course</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                    <Label htmlFor="term">Term</Label>
                    <Select
                      value={newCourse.term}
                      onValueChange={(value) => setNewCourse({ ...newCourse, term: value })}
                    >
                      <SelectTrigger id="term">
                        <SelectValue placeholder="Select Term" />
                      </SelectTrigger>
                      <SelectContent>
                        {terms.map((term) => (
                          <SelectItem key={term} value={term}>
                            {term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={addCourse}
                  disabled={!newCourse.code || !newCourse.name || !newCourse.term}
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Term Management</CardTitle>
              <CardDescription>Add and manage terms for organizing your courses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term Name</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map((term) => (
                    <TableRow key={term}>
                      <TableCell>{term}</TableCell>
                      <TableCell>{courses.filter((course) => course.term === term).length} courses</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTerm(term)}
                          disabled={terms.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <div className="w-full">
                <h3 className="font-medium mb-2">Add New Term</h3>
                <div className="flex gap-2">
                  <Input
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    placeholder="e.g., Semester 3"
                    className="flex-1"
                  />
                  <Button onClick={addTerm} disabled={!newTerm || terms.includes(newTerm)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Term
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
