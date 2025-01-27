"use client"

import React, { useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, Users, AlertTriangle, CheckCircle } from "lucide-react"

interface Task {
  id: number
  name: string
  priority: string
}

interface EmployeeSchedule {
  id: number
  name: string
  tasks?: Task[]
}

interface ShiftDetail {
  shift: string
  time: string
  employees: EmployeeSchedule[]
}

export default function ShiftManagementDashboard() {
  const [peakHours, setPeakHours] = useState<any[]>([])
  const [schedule, setSchedule] = useState<ShiftDetail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("forecast")

  const fetchPeakHours = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get("http://localhost:8000/forecast_peak_hours")
      setPeakHours(response.data.peak_hours)
    } catch (error) {
      console.error("Error fetching peak hours:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSchedule = async () => {
    setIsLoading(true)
    try {
      await axios.post(
        "http://localhost:8000/adjust_priority",
        peakHours.map((ph) => ph.hour),
      )
      const scheduleResponse = await axios.post("http://localhost:8000/schedule_shifts")
      setSchedule(scheduleResponse.data.schedule)
      setActiveTab("schedule")
    } catch (error) {
      console.error("Error generating schedule:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const notifyEmployees = async () => {
    setIsLoading(true)
    try {
      await axios.post("http://localhost:8000/notify_employees", schedule)
      alert("Employees notified successfully!")
    } catch (error) {
      console.error("Error notifying employees:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 bg-gradient-to-br from-green-50 to-orange-50 min-h-screen">
      <Card className="w-full max-w-4xl mx-auto shadow-lg border-t-4 border-t-green-500">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="text-3xl font-bold flex items-center">
  <img
    src="./7-Eleven_logo_2021.svg.png" // Adjust this path as per your folder structure
    alt="7-Eleven Logo"
    className="mr-2 h-10 w-7"
  />
  7-Eleven Shift Management
</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="forecast" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Peak Hours Forecast
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Shift Schedule
              </TabsTrigger>
            </TabsList>
            <TabsContent value="forecast">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                  <CardHeader className="bg-orange-500 text-white mb-4">
                    <CardTitle className="text-xl flex items-center">
                      <Users className="mr-2" /> Peak Hours Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={fetchPeakHours}
                      className="mb-4 bg-green-500 hover:bg-green-600 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Forecasting..." : "Forecast Peak Hours"}
                    </Button>
                    {peakHours.length > 0 && (
                      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-green-700">Hour</TableHead>
                              <TableHead className="text-green-700">Expected Customers</TableHead>
                              <TableHead className="text-green-700">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {peakHours.map((hour, index) => (
                              <TableRow key={index}>
                                <TableCell>{hour.hour}</TableCell>
                                <TableCell>{hour.expected_customers}</TableCell>
                                <TableCell>
                                  {hour.expected_customers > 50 ? (
                                    <Badge variant="destructive" className="bg-red-500 text-white">
                                      <AlertTriangle className="mr-1 h-4 w-4" /> Peak
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                      <CheckCircle className="mr-1 h-4 w-4" /> Normal
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            <TabsContent value="schedule">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card>
                  <CardHeader className="bg-orange-500 text-white mb-4">
                    <CardTitle className="text-xl flex items-center">
                      <Clock className="mr-2" /> Shift Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4 mb-4">
                      <Button
                        onClick={generateSchedule}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        disabled={isLoading || peakHours.length === 0}
                      >
                        {isLoading ? "Generating..." : "Generate Schedule"}
                      </Button>
                      <Button
                        onClick={notifyEmployees}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={isLoading || schedule.length === 0}
                      >
                        {isLoading ? "Notifying..." : "Notify Employees"}
                      </Button>
                    </div>
                    {schedule.length > 0 && (
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                        {schedule.map((shiftDetail, index) => (
                          <Card key={index} className="mb-4 overflow-hidden border-l-4 border-l-green-500">
                            <CardHeader className="bg-green-100 text-green-800">
                              <CardTitle className="text-lg">
                                {shiftDetail.shift} Shift ({shiftDetail.time})
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-green-700">Employee</TableHead>
                                    <TableHead className="text-green-700">Tasks</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {shiftDetail.employees.map((emp, empIndex) => (
                                    <TableRow key={empIndex}>
                                      <TableCell className="font-medium">{emp.name}</TableCell>
                                      <TableCell>
                                        {emp.tasks && emp.tasks.length > 0 ? (
                                          emp.tasks.map((task) => (
                                            <div
                                              key={task.id}
                                              className={`mb-1 ${
                                                task.priority === "high"
                                                  ? "text-red-600 font-semibold"
                                                  : "text-gray-600"
                                              }`}
                                            >
                                              {task.name}{" "}
                                              <Badge
                                                variant={task.priority === "high" ? "destructive" : "secondary"}
                                                className={`ml-2 ${
                                                  task.priority === "high"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-green-100 text-green-800"
                                                }`}
                                              >
                                                {task.priority}
                                              </Badge>
                                            </div>
                                          ))
                                        ) : (
                                          <span className="text-gray-500 italic">No tasks assigned</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        ))}
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

