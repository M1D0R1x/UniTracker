"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, PlusCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Term {
  id: string
  name: string
  credits: number
  gpa: number
}

export default function CGPACalculator() {
  const [terms, setTerms] = useState<Term[]>([
    {
      id: "1",
      name: "Semester 1",
      credits: 18,
      gpa: 3.7,
    },
  ])

  const [newTerm, setNewTerm] = useState<Omit<Term, "id">>({
    name: "",
    credits: 18,
    gpa: 0,
  })

  const addTerm = () => {
    setTerms([
      ...terms,
      {
        id: Date.now().toString(),
        ...newTerm,
      },
    ])

    // Reset form
    setNewTerm({
      name: "",
      credits: 18,
      gpa: 0,
    })
  }

  const removeTerm = (id: string) => {
    setTerms(terms.filter((term) => term.id !== id))
  }

  const updateTerm = (id: string, field: keyof Term, value: any) => {
    setTerms(
      terms.map((term) => {
        if (term.id === id) {
          return { ...term, [field]: value }
        }
        return term
      }),
    )
  }

  const calculateCGPA = () => {
    if (terms.length === 0) return 0

    const totalCredits = terms.reduce((sum, term) => sum + term.credits, 0)
    const weightedGPA = terms.reduce((sum, term) => sum + term.credits * term.gpa, 0)

    return weightedGPA / totalCredits
  }

  const cgpa = calculateCGPA()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">CGPA Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Terms</CardTitle>
              <CardDescription>Enter your term details to calculate your Cumulative GPA</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map((term) => (
                    <TableRow key={term.id}>
                      <TableCell>
                        <Input value={term.name} onChange={(e) => updateTerm(term.id, "name", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={term.credits}
                          onChange={(e) => updateTerm(term.id, "credits", Number.parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="4"
                          step="0.01"
                          value={term.gpa}
                          onChange={(e) => updateTerm(term.id, "gpa", Number.parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeTerm(term.id)}>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor="name">Term Name</Label>
                    <Input
                      id="name"
                      value={newTerm.name}
                      onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                      placeholder="e.g., Semester 2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      min="1"
                      value={newTerm.credits}
                      onChange={(e) => setNewTerm({ ...newTerm, credits: Number.parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpa">GPA</Label>
                    <Input
                      id="gpa"
                      type="number"
                      min="0"
                      max="4"
                      step="0.01"
                      value={newTerm.gpa}
                      onChange={(e) => setNewTerm({ ...newTerm, gpa: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <Button onClick={addTerm} disabled={!newTerm.name} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Term
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>CGPA Summary</CardTitle>
              <CardDescription>Your calculated Cumulative GPA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{cgpa.toFixed(2)}</div>
                <p className="text-muted-foreground">
                  Based on {terms.length} term{terms.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-2">Term Summary</h3>
                <div className="space-y-2">
                  {terms.map((term) => (
                    <div key={term.id} className="flex justify-between">
                      <span>{term.name}:</span>
                      <span>{term.gpa.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-2">Total Credits</h3>
                <div className="text-2xl font-bold text-center">
                  {terms.reduce((sum, term) => sum + term.credits, 0)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
