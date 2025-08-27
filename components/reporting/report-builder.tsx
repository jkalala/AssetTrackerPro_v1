'use client'

import React, { useState, useEffect } from 'react'
// import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  X, 
  Filter, 
  SortAsc, 
  BarChart3, 
  Table, 
  PieChart, 
  TrendingUp,
  Eye,
  Save,
  Download
} from 'lucide-react'
import { 
  ReportDefinition, 
  ReportField, 
  ReportFilter, 
  ReportSort, 
  ReportGrouping,
  ReportVisualization,
  AvailableField 
} from '@/lib/types/reporting'

interface ReportBuilderProps {
  availableFields: AvailableField[]
  initialReport?: Partial<ReportDefinition>
  onSave: (report: Omit<ReportDefinition, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => void
  onPreview: (report: Omit<ReportDefinition, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => void
}

export function ReportBuilder({ availableFields, initialReport, onSave, onPreview }: ReportBuilderProps) {
  const [reportName, setReportName] = useState(initialReport?.name || '')
  const [reportDescription, setReportDescription] = useState(initialReport?.description || '')
  const [reportCategory, setReportCategory] = useState(initialReport?.category || 'custom')
  const [selectedFields, setSelectedFields] = useState<ReportField[]>(initialReport?.fields || [])
  const [filters, setFilters] = useState<ReportFilter[]>(initialReport?.filters || [])
  const [sorting, setSorting] = useState<ReportSort[]>(initialReport?.sorting || [])
  const [grouping, setGrouping] = useState<ReportGrouping[]>(initialReport?.grouping || [])
  const [visualization, setVisualization] = useState<ReportVisualization>(
    initialReport?.visualization || {
      type: 'table',
      config: {}
    }
  )

  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, AvailableField[]>)

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const { source, destination } = result

    if (source.droppableId === 'available-fields' && destination.droppableId === 'selected-fields') {
      const field = availableFields.find(f => f.id === result.draggableId)
      if (field && !selectedFields.find(f => f.id === field.id)) {
        const newField: ReportField = {
          id: field.id,
          name: field.name,
          type: field.type,
          table: field.table,
          column: field.column
        }
        setSelectedFields([...selectedFields, newField])
      }
    } else if (source.droppableId === 'selected-fields' && destination.droppableId === 'selected-fields') {
      const newFields = Array.from(selectedFields)
      const [reorderedField] = newFields.splice(source.index, 1)
      newFields.splice(destination.index, 0, reorderedField)
      setSelectedFields(newFields)
    }
  }

  const removeField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter(f => f.id !== fieldId))
  }

  const updateFieldAggregation = (fieldId: string, aggregation?: string) => {
    setSelectedFields(selectedFields.map(f => 
      f.id === fieldId ? { ...f, aggregation: aggregation as any } : f
    ))
  }

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: ''
    }
    setFilters([...filters, newFilter])
  }

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map(f => f.id === filterId ? { ...f, ...updates } : f))
  }

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(f => f.id !== filterId))
  }

  const addSort = () => {
    if (selectedFields.length === 0) return
    
    const newSort: ReportSort = {
      field: selectedFields[0].id,
      direction: 'asc'
    }
    setSorting([...sorting, newSort])
  }

  const updateSort = (index: number, updates: Partial<ReportSort>) => {
    setSorting(sorting.map((s, i) => i === index ? { ...s, ...updates } : s))
  }

  const removeSort = (index: number) => {
    setSorting(sorting.filter((_, i) => i !== index))
  }

  const addGrouping = () => {
    if (selectedFields.length === 0) return
    
    const newGrouping: ReportGrouping = {
      field: selectedFields[0].id,
      type: 'group'
    }
    setGrouping([...grouping, newGrouping])
  }

  const updateGrouping = (index: number, updates: Partial<ReportGrouping>) => {
    setGrouping(grouping.map((g, i) => i === index ? { ...g, ...updates } : g))
  }

  const removeGrouping = (index: number) => {
    setGrouping(grouping.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const report = {
      name: reportName,
      description: reportDescription,
      category: reportCategory,
      fields: selectedFields,
      filters,
      sorting,
      grouping,
      visualization,
      is_active: true
    }
    onSave(report)
  }

  const handlePreview = () => {
    const report = {
      name: reportName,
      description: reportDescription,
      category: reportCategory,
      fields: selectedFields,
      filters,
      sorting,
      grouping,
      visualization,
      is_active: true
    }
    onPreview(report)
  }

  return (
    <div className="space-y-6">
      {/* Report Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>
            <div>
              <Label htmlFor="report-category">Category</Label>
              <Select value={reportCategory} onValueChange={setReportCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assets">Assets</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="report-description">Description</Label>
            <Input
              id="report-description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Enter report description"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Available Fields */}
        <div className="col-span-4">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="text-sm">Available Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="available-fields">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {Object.entries(fieldsByCategory).map(([category, fields]) => (
                          <div key={category} className="mb-4">
                            <h4 className="font-medium text-sm mb-2 capitalize">{category}</h4>
                            {fields.map((field, index) => (
                              <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-2 mb-2 border rounded cursor-move text-sm ${
                                      snapshot.isDragging ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="font-medium">{field.name}</div>
                                    <div className="text-xs text-gray-500">{field.type}</div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </div>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Report Configuration */}
        <div className="col-span-8">
          <Tabs defaultValue="fields" className="space-y-4">
            <TabsList>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="sorting">Sorting</TabsTrigger>
              <TabsTrigger value="grouping">Grouping</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
            </TabsList>

            {/* Fields Tab */}
            <TabsContent value="fields">
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle className="text-sm">Selected Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="selected-fields">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {selectedFields.map((field, index) => (
                              <Draggable key={field.id} draggableId={field.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-3 border rounded ${
                                      snapshot.isDragging ? 'bg-blue-50 border-blue-200' : 'bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-sm">{field.name}</div>
                                        <div className="text-xs text-gray-500">{field.type}</div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {field.type === 'number' && (
                                          <Select
                                            value={field.aggregation || 'none'}
                                            onValueChange={(value) => 
                                              updateFieldAggregation(field.id, value === 'none' ? undefined : value)
                                            }
                                          >
                                            <SelectTrigger className="w-20 h-8 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">None</SelectItem>
                                              <SelectItem value="sum">Sum</SelectItem>
                                              <SelectItem value="avg">Avg</SelectItem>
                                              <SelectItem value="count">Count</SelectItem>
                                              <SelectItem value="min">Min</SelectItem>
                                              <SelectItem value="max">Max</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removeField(field.id)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters">
              <Card className="h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Filters</CardTitle>
                  <Button size="sm" onClick={addFilter}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Filter
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {filters.map((filter) => (
                        <div key={filter.id} className="p-3 border rounded">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                              <Select
                                value={filter.field}
                                onValueChange={(value) => updateFilter(filter.id, { field: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedFields.map((field) => (
                                    <SelectItem key={field.id} value={field.id}>
                                      {field.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3">
                              <Select
                                value={filter.operator}
                                onValueChange={(value) => updateFilter(filter.id, { operator: value as any })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="not_equals">Not Equals</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="greater_than">Greater Than</SelectItem>
                                  <SelectItem value="less_than">Less Than</SelectItem>
                                  <SelectItem value="between">Between</SelectItem>
                                  <SelectItem value="in">In</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-4">
                              <Input
                                className="h-8"
                                value={filter.value}
                                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                placeholder="Filter value"
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFilter(filter.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sorting Tab */}
            <TabsContent value="sorting">
              <Card className="h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Sorting</CardTitle>
                  <Button size="sm" onClick={addSort} disabled={selectedFields.length === 0}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sort
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sorting.map((sort, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-6">
                            <Select
                              value={sort.field}
                              onValueChange={(value) => updateSort(index, { field: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedFields.map((field) => (
                                  <SelectItem key={field.id} value={field.id}>
                                    {field.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-5">
                            <Select
                              value={sort.direction}
                              onValueChange={(value) => updateSort(index, { direction: value as any })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="asc">Ascending</SelectItem>
                                <SelectItem value="desc">Descending</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSort(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grouping Tab */}
            <TabsContent value="grouping">
              <Card className="h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Grouping</CardTitle>
                  <Button size="sm" onClick={addGrouping} disabled={selectedFields.length === 0}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Grouping
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {grouping.map((group, index) => (
                      <div key={index} className="p-3 border rounded">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <Select
                              value={group.field}
                              onValueChange={(value) => updateGrouping(index, { field: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedFields.map((field) => (
                                  <SelectItem key={field.id} value={field.id}>
                                    {field.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Select
                              value={group.type}
                              onValueChange={(value) => updateGrouping(index, { type: value as any })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="group">Group</SelectItem>
                                <SelectItem value="date_group">Date Group</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            {group.type === 'date_group' && (
                              <Select
                                value={group.dateInterval || 'month'}
                                onValueChange={(value) => updateGrouping(index, { dateInterval: value as any })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="day">Day</SelectItem>
                                  <SelectItem value="week">Week</SelectItem>
                                  <SelectItem value="month">Month</SelectItem>
                                  <SelectItem value="quarter">Quarter</SelectItem>
                                  <SelectItem value="year">Year</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeGrouping(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Visualization Tab */}
            <TabsContent value="visualization">
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle className="text-sm">Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Visualization Type</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <Button
                          variant={visualization.type === 'table' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualization({ ...visualization, type: 'table' })}
                        >
                          <Table className="h-4 w-4 mr-1" />
                          Table
                        </Button>
                        <Button
                          variant={visualization.type === 'chart' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualization({ ...visualization, type: 'chart', chartType: 'bar' })}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Chart
                        </Button>
                        <Button
                          variant={visualization.type === 'metric' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualization({ ...visualization, type: 'metric' })}
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Metric
                        </Button>
                        <Button
                          variant={visualization.type === 'map' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualization({ ...visualization, type: 'map' })}
                        >
                          <PieChart className="h-4 w-4 mr-1" />
                          Map
                        </Button>
                      </div>
                    </div>

                    {visualization.type === 'chart' && (
                      <div>
                        <Label>Chart Type</Label>
                        <Select
                          value={visualization.chartType || 'bar'}
                          onValueChange={(value) => setVisualization({ 
                            ...visualization, 
                            chartType: value as any 
                          })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="line">Line Chart</SelectItem>
                            <SelectItem value="pie">Pie Chart</SelectItem>
                            <SelectItem value="area">Area Chart</SelectItem>
                            <SelectItem value="scatter">Scatter Plot</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={handlePreview} disabled={selectedFields.length === 0}>
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <Button onClick={handleSave} disabled={!reportName || selectedFields.length === 0}>
          <Save className="h-4 w-4 mr-1" />
          Save Report
        </Button>
      </div>
    </div>
  )
}