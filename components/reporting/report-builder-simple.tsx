'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { 
  ReportDefinition, 
  ReportField, 
  ReportFilter, 
  ReportSort, 
  ReportGrouping, 
  ReportVisualization 
} from '@/lib/types/reporting';

interface ReportBuilderProps {
  initialReport?: Partial<ReportDefinition>;
  availableFields: ReportField[];
  onSave: (report: Omit<ReportDefinition, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => void;
  onPreview: (report: Omit<ReportDefinition, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => void;
}

export function ReportBuilder({ initialReport, availableFields, onSave, onPreview }: ReportBuilderProps) {
  const [reportName, setReportName] = useState(initialReport?.name || '');
  const [reportDescription, setReportDescription] = useState(initialReport?.description || '');
  const [reportCategory, setReportCategory] = useState(initialReport?.category || '');
  const [selectedFields, setSelectedFields] = useState<ReportField[]>(initialReport?.fields || []);
  const [filters, setFilters] = useState<ReportFilter[]>(initialReport?.filters || []);
  const [sorting, setSorting] = useState<ReportSort[]>(initialReport?.sorting || []);
  const [grouping, setGrouping] = useState<ReportGrouping[]>(initialReport?.grouping || []);
  const [visualization, setVisualization] = useState<ReportVisualization>(
    initialReport?.visualization || {
      type: 'table',
      config: {}
    }
  );

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
    };
    onSave(report);
  };

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
    };
    onPreview(report);
  };

  const addField = (field: ReportField) => {
    if (!selectedFields.find(f => f.id === field.id)) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const removeField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter(f => f.id !== fieldId));
  };

  return (
    <div className="space-y-6">
      {/* Report Details */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>Basic information about your report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label htmlFor="report-description">Description</Label>
            <Input
              id="report-description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Enter report description"
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
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Field Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
          <CardDescription>Select the fields to include in your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Fields */}
            <div>
              <h4 className="font-medium mb-3">Available Fields</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableFields
                  .filter(field => !selectedFields.find(f => f.id === field.id))
                  .map((field) => (
                    <div
                      key={field.id}
                      className="p-2 border rounded cursor-pointer bg-white hover:bg-gray-50 flex justify-between items-center"
                      onClick={() => addField(field)}
                    >
                      <span>{field.name}</span>
                      <Plus className="h-4 w-4" />
                    </div>
                  ))}
              </div>
            </div>

            {/* Selected Fields */}
            <div>
              <h4 className="font-medium mb-3">Selected Fields</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedFields.map((field) => (
                  <div
                    key={field.id}
                    className="p-2 border rounded bg-blue-50 flex justify-between items-center"
                  >
                    <span>{field.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
          <CardDescription>Choose how to display your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="visualization-type">Visualization Type</Label>
            <Select 
              value={visualization.type} 
              onValueChange={(value) => setVisualization({ ...visualization, type: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visualization type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="chart">Chart</SelectItem>
                <SelectItem value="metric">Metric</SelectItem>
                <SelectItem value="map">Map</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={handlePreview}>
          Preview
        </Button>
        <Button onClick={handleSave}>
          Save Report
        </Button>
      </div>
    </div>
  );
}