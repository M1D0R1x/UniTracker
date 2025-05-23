import Link from "next/link"
import { Calculator, BookOpen, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">GPA Predictor</h1>
        <p className="text-muted-foreground">Calculate your TGPA and CGPA with ease</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              TGPA Calculator
            </CardTitle>
            <CardDescription>Calculate your Term GPA based on current courses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Add your current semester courses with attendance, CA marks, mid-term marks, and more to predict your
              TGPA.
            </p>
            <Link href="/tgpa-calculator">
              <Button className="w-full">Calculate TGPA</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              CGPA Calculator
            </CardTitle>
            <CardDescription>Calculate your Cumulative GPA across multiple terms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Combine multiple terms to calculate your overall CGPA and track your academic progress.
            </p>
            <Link href="/cgpa-calculator">
              <Button className="w-full">Calculate CGPA</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Manager
            </CardTitle>
            <CardDescription>Manage your courses and their details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Add, edit, and organize your courses with their credit hours and other important details.
            </p>
            <Link href="/course-manager">
              <Button className="w-full">Manage Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
