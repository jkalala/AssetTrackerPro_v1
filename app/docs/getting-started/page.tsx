'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  ArrowRight,
  Play,
  Users,
  Settings,
  Package,
  QrCode,
  BarChart3,
  Shield,
  Lightbulb,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Video,
  Download,
  Rocket,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
} from 'lucide-react'

const quickStartSteps = [
  {
    id: 1,
    title: 'Complete Profile Setup',
    description: 'Set up your account with organization details',
    time: '2 minutes',
    completed: false,
  },
  {
    id: 2,
    title: 'Add Your First Asset',
    description: 'Create your first asset entry in the system',
    time: '3 minutes',
    completed: false,
  },
  {
    id: 3,
    title: 'Generate QR Code',
    description: 'Create a QR code for easy asset tracking',
    time: '1 minute',
    completed: false,
  },
  {
    id: 4,
    title: 'Scan QR Code',
    description: 'Test the scanning functionality',
    time: '1 minute',
    completed: false,
  },
  {
    id: 5,
    title: 'View Dashboard Analytics',
    description: 'Explore your asset management dashboard',
    time: '2 minutes',
    completed: false,
  },
]

const systemFeatures = [
  {
    icon: Package,
    title: 'Asset Management',
    description:
      'Create, organize, and track all your physical and digital assets with detailed information and lifecycle management.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: QrCode,
    title: 'QR Code System',
    description:
      'Generate unique QR codes for instant asset identification, bulk operations, and mobile scanning capabilities.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description:
      'Monitor performance with live dashboards, custom reports, and comprehensive data visualization tools.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Work together with role-based access, permission controls, activity tracking, and team workflows.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    icon: Shield,
    title: 'Security & Compliance',
    description:
      'Enterprise-grade security with audit logs, compliance reporting, and data protection features.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Globe,
    title: 'Cloud-Based Platform',
    description:
      'Access your assets from anywhere with our secure, scalable cloud infrastructure and offline capabilities.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
]

const benefits = [
  {
    icon: Zap,
    title: 'Improved Efficiency',
    description:
      'Reduce time spent searching for assets and streamline operations with automated workflows and smart notifications.',
    stats: '75% faster asset location',
  },
  {
    icon: Shield,
    title: 'Better Security',
    description:
      'Track asset movement, prevent loss or theft with real-time alerts, and maintain comprehensive audit trails.',
    stats: '90% reduction in asset loss',
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Decisions',
    description:
      'Make informed decisions with comprehensive analytics, predictive insights, and customizable reporting.',
    stats: '3x better asset utilization',
  },
]

export default function GettingStartedPage() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  const toggleStep = (stepId: number) => {
    setCompletedSteps(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    )
  }

  const progress = (completedSteps.length / quickStartSteps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center mb-6"
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-3 rounded-2xl shadow-lg">
              <Play className="h-8 w-8 text-white" />
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-green-900 to-emerald-900 bg-clip-text text-transparent mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Getting Started Guide
          </motion.h1>

          <motion.p
            className="text-xl text-slate-600 text-center max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Welcome to your Asset Management System! This comprehensive guide will help you get up
            and running quickly and efficiently with all the tools you need to manage your assets
            professionally.
          </motion.p>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-green-800 text-2xl flex items-center">
                    <Rocket className="h-6 w-6 mr-2" />
                    Quick Start Progress
                  </CardTitle>
                  <CardDescription className="text-green-700 text-lg">
                    Complete these steps to get your system ready for use
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-800">{Math.round(progress)}%</div>
                  <div className="text-sm text-green-600">Complete</div>
                </div>
              </div>
              <Progress value={progress} className="mt-4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quickStartSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      completedSteps.includes(step.id)
                        ? 'bg-green-100 border-green-300'
                        : 'bg-white border-green-200 hover:bg-green-50'
                    }`}
                    onClick={() => toggleStep(step.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm ${
                        completedSteps.includes(step.id)
                          ? 'bg-green-600 text-white'
                          : 'bg-green-200 text-green-800'
                      }`}
                    >
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{step.title}</div>
                      <div className="text-sm text-slate-600">{step.description}</div>
                    </div>
                    <div className="text-xs text-green-600 font-medium">{step.time}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="setup"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Setup
            </TabsTrigger>
            <TabsTrigger
              value="first-asset"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              First Asset
            </TabsTrigger>
            <TabsTrigger
              value="qr-codes"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              QR Codes
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* System Overview */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-2xl">System Overview</CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Understanding the core components of your asset management system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-slate-900">
                      What is Asset Management?
                    </h3>
                    <p className="text-slate-600 mb-6 leading-relaxed text-lg">
                      Asset management is the systematic approach to tracking, maintaining, and
                      optimizing your organization's physical and digital assets throughout their
                      lifecycle. Our comprehensive system provides you with powerful tools to
                      streamline operations, reduce costs, and improve efficiency.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900">Core Capabilities:</h4>
                        <ul className="space-y-3 text-slate-600">
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            Track asset location, status, and condition in real-time
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            Generate and scan QR codes for instant identification
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            Monitor asset utilization and performance metrics
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            Generate comprehensive reports and analytics
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900">Advanced Features:</h4>
                        <ul className="space-y-3 text-slate-600">
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            Automated maintenance scheduling and alerts
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            Depreciation tracking and financial reporting
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            Multi-location support with GPS integration
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            API integration with existing business systems
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Feature Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {systemFeatures.map((feature, index) => (
                      <motion.div
                        key={index}
                        className={`p-6 border rounded-xl ${feature.bgColor} border-opacity-50 hover:shadow-lg transition-all duration-200`}
                        whileHover={{ scale: 1.02, y: -4 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <feature.icon className={`h-10 w-10 ${feature.color} mb-4`} />
                        <h4 className="font-semibold text-slate-900 mb-2">{feature.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Benefits */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-2xl">Key Benefits</CardTitle>
                  <CardDescription className="text-slate-600">
                    Discover how our asset management system transforms your operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                      >
                        <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <benefit.icon className="h-10 w-10 text-blue-600" />
                        </div>
                        <h4 className="font-semibold mb-3 text-slate-900 text-lg">
                          {benefit.title}
                        </h4>
                        <p className="text-slate-600 mb-3 leading-relaxed">{benefit.description}</p>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-300"
                        >
                          {benefit.stats}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="setup">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-2xl">Initial Setup</CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Configure your account and system preferences for optimal performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Pro Tip:</strong> Complete your profile setup first to ensure all
                      features work correctly and to personalize your experience.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    <motion.div
                      className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 rounded-r-lg"
                      whileHover={{ x: 4 }}
                    >
                      <h4 className="font-semibold text-blue-900 text-lg mb-2">
                        Step 1: Complete Your Profile
                      </h4>
                      <p className="text-blue-800 mb-4 leading-relaxed">
                        Add your name, organization details, contact information, and preferences.
                        This helps personalize your experience and enables team collaboration
                        features.
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-blue-700">
                          <strong>Required Information:</strong>
                        </div>
                        <ul className="text-sm text-blue-700 space-y-1 ml-4">
                          <li>• Full name and job title</li>
                          <li>• Organization name and industry</li>
                          <li>• Contact email and phone number</li>
                          <li>• Timezone and language preferences</li>
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Go to Profile Settings
                      </Button>
                    </motion.div>

                    <motion.div
                      className="border-l-4 border-green-500 pl-6 py-4 bg-green-50 rounded-r-lg"
                      whileHover={{ x: 4 }}
                    >
                      <h4 className="font-semibold text-green-900 text-lg mb-2">
                        Step 2: Configure System Preferences
                      </h4>
                      <p className="text-green-800 mb-4 leading-relaxed">
                        Set your timezone, notification preferences, default asset categories, and
                        security settings to match your organization's needs.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-green-800">
                            General Settings:
                          </div>
                          <ul className="text-sm text-green-700 space-y-1 mt-1">
                            <li>• Timezone configuration</li>
                            <li>• Date and time formats</li>
                            <li>• Default currency</li>
                            <li>• Language preferences</li>
                          </ul>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-800">Notifications:</div>
                          <ul className="text-sm text-green-700 space-y-1 mt-1">
                            <li>• Email notification settings</li>
                            <li>• Mobile push notifications</li>
                            <li>• Alert thresholds</li>
                            <li>• Report delivery schedules</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50 rounded-r-lg"
                      whileHover={{ x: 4 }}
                    >
                      <h4 className="font-semibold text-purple-900 text-lg mb-2">
                        Step 3: Invite Team Members (Optional)
                      </h4>
                      <p className="text-purple-800 mb-4 leading-relaxed">
                        Add team members and assign appropriate roles and permissions. Set up
                        departments and access levels for better organization.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="font-medium text-purple-900">Admin</div>
                          <div className="text-xs text-purple-700">Full access</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="font-medium text-purple-900">Manager</div>
                          <div className="text-xs text-purple-700">Department access</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <div className="font-medium text-purple-900">User</div>
                          <div className="text-xs text-purple-700">View & scan only</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Team
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900">System Requirements</CardTitle>
                  <CardDescription className="text-slate-600">
                    Ensure your devices and browsers are compatible for the best experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <div className="flex items-center mb-4">
                        <Monitor className="h-6 w-6 text-blue-600 mr-2" />
                        <h4 className="font-semibold text-slate-900">Desktop Browsers</h4>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          Chrome 90+ (Recommended)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          Firefox 88+
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          Safari 14+
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          Edge 90+
                        </li>
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center mb-4">
                        <Smartphone className="h-6 w-6 text-purple-600 mr-2" />
                        <h4 className="font-semibold text-slate-900">Mobile Support</h4>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          iOS 14+ (Safari)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          Android 8+ (Chrome)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          Camera access for QR scanning
                        </li>
                        <li className="flex items-center">
                          <Wifi className="h-4 w-4 text-blue-600 mr-2" />
                          Internet connection required
                        </li>
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center mb-4">
                        <Target className="h-6 w-6 text-orange-600 mr-2" />
                        <h4 className="font-semibold text-slate-900">Recommended Specs</h4>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          4GB RAM minimum
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          Stable internet connection
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          Modern processor (2015+)
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                          1920x1080 display or higher
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Continue with other tabs... */}
          <TabsContent value="first-asset">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* First Asset Content */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-2xl">
                    Creating Your First Asset
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Learn how to add and configure your first asset in the system with best
                    practices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <Alert className="border-green-200 bg-green-50">
                    <Package className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Getting Started:</strong> Start with a simple asset like a laptop,
                      office chair, or piece of equipment to get familiar with the process.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-8">
                    {[
                      {
                        step: 1,
                        title: 'Navigate to Add Asset',
                        description:
                          'Access the asset creation form from your dashboard or navigation menu.',
                        details:
                          "Click the prominent 'Add Asset' button in your dashboard, or use the main navigation menu to access the asset creation form. The form is designed to be intuitive and guide you through each step.",
                        color: 'blue',
                      },
                      {
                        step: 2,
                        title: 'Fill in Asset Details',
                        description: 'Provide essential and optional information about your asset.',
                        details:
                          'Complete the required fields and add any additional information that will help you track and manage the asset effectively.',
                        color: 'green',
                      },
                      {
                        step: 3,
                        title: 'Save and Generate QR Code',
                        description:
                          'Complete the asset creation and optionally generate a QR code.',
                        details:
                          "After saving, you can immediately generate a QR code for easy tracking and access the asset's detailed information page.",
                        color: 'purple',
                      },
                    ].map((step, index) => (
                      <motion.div
                        key={step.step}
                        className="flex items-start space-x-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                      >
                        <div
                          className={`bg-${step.color}-100 text-${step.color}-600 rounded-full w-12 h-12 flex items-center justify-center font-semibold text-lg flex-shrink-0`}
                        >
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 text-lg mb-2">
                            {step.title}
                          </h4>
                          <p className="text-slate-600 mb-3 leading-relaxed">{step.description}</p>
                          <p className="text-sm text-slate-500 leading-relaxed">{step.details}</p>
                          {step.step === 1 && (
                            <Button variant="outline" size="sm" className="mt-3">
                              <Package className="h-4 w-4 mr-2" />
                              Add New Asset
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Asset Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h5 className="font-semibold text-slate-900 text-lg">Required Information</h5>
                      <div className="space-y-3">
                        {[
                          {
                            field: 'Asset Name',
                            desc: 'Descriptive and unique identifier',
                            example: 'MacBook Pro 16-inch #001',
                          },
                          {
                            field: 'Category',
                            desc: 'Choose from predefined categories',
                            example: 'IT Equipment',
                          },
                          {
                            field: 'Location',
                            desc: 'Current physical location',
                            example: 'Office A - Desk 12',
                          },
                          {
                            field: 'Status',
                            desc: 'Current operational status',
                            example: 'Active, In Use',
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="font-medium text-slate-900">{item.field}</div>
                            <div className="text-sm text-slate-600 mt-1">{item.desc}</div>
                            <div className="text-xs text-blue-600 mt-2 font-medium">
                              Example: {item.example}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h5 className="font-semibold text-slate-900 text-lg">Optional Information</h5>
                      <div className="space-y-3">
                        {[
                          {
                            field: 'Description',
                            desc: 'Detailed asset information',
                            example: 'Company laptop for development team',
                          },
                          {
                            field: 'Purchase Value',
                            desc: 'Original purchase price',
                            example: '$2,500.00',
                          },
                          {
                            field: 'Purchase Date',
                            desc: 'Date of acquisition',
                            example: '2024-01-15',
                          },
                          {
                            field: 'Serial Number',
                            desc: 'Manufacturer serial number',
                            example: 'ABC123XYZ789',
                          },
                          {
                            field: 'Warranty Info',
                            desc: 'Warranty expiration date',
                            example: '2027-01-15',
                          },
                          {
                            field: 'Supplier',
                            desc: 'Vendor or supplier name',
                            example: 'Tech Solutions Inc.',
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            whileHover={{ scale: 1.01 }}
                          >
                            <div className="font-medium text-slate-900">{item.field}</div>
                            <div className="text-sm text-slate-600 mt-1">{item.desc}</div>
                            <div className="text-xs text-purple-600 mt-2 font-medium">
                              Example: {item.example}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Asset Categories */}
                  <div className="bg-slate-50 p-6 rounded-xl">
                    <h5 className="font-semibold mb-4 text-slate-900 text-lg">
                      Available Asset Categories
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        'IT Equipment',
                        'Furniture',
                        'Vehicles',
                        'Tools',
                        'AV Equipment',
                        'Office Supplies',
                        'Machinery',
                        'Medical Equipment',
                        'Safety Equipment',
                        'Software Licenses',
                        'Real Estate',
                        'Other',
                      ].map((category, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge
                            variant="outline"
                            className="w-full justify-center py-2 hover:bg-blue-50 hover:border-blue-300 cursor-pointer"
                          >
                            {category}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Best Practices */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900">
                    Best Practices for Asset Creation
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Follow these guidelines to maintain consistent and effective asset management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h5 className="font-medium text-green-800 text-lg">✅ Do's</h5>
                      {[
                        {
                          title: 'Use Descriptive Names',
                          desc: 'Include model, brand, or unique identifiers in asset names for easy identification',
                        },
                        {
                          title: 'Consistent Categorization',
                          desc: 'Use consistent categories to make searching and filtering easier across your organization',
                        },
                        {
                          title: 'Include Serial Numbers',
                          desc: 'Add serial numbers or unique identifiers in the description for warranty and support purposes',
                        },
                        {
                          title: 'Regular Updates',
                          desc: 'Keep asset information current by updating status, location, and condition regularly',
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h6 className="font-medium text-slate-900">{item.title}</h6>
                            <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="space-y-6">
                      <h5 className="font-medium text-red-800 text-lg">❌ Don'ts</h5>
                      {[
                        {
                          title: 'Avoid Generic Names',
                          desc: "Don't use vague names like 'Laptop 1' - be specific about model and purpose",
                        },
                        {
                          title: 'Skip Important Details',
                          desc: "Don't leave critical fields empty - complete information helps with tracking and reporting",
                        },
                        {
                          title: 'Inconsistent Categories',
                          desc: 'Avoid creating new categories unnecessarily - use existing ones for better organization',
                        },
                        {
                          title: 'Forget Location Updates',
                          desc: "Don't forget to update asset locations when they're moved between departments or offices",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h6 className="font-medium text-slate-900">{item.title}</h6>
                            <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="qr-codes">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* QR Code System Overview */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-2xl">QR Code System</CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Master QR code generation, scanning, and management for seamless asset tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center text-slate-900 text-lg">
                        <QrCode className="h-6 w-6 mr-2 text-purple-600" />
                        What are QR Codes?
                      </h4>
                      <p className="text-slate-600 mb-4 leading-relaxed">
                        QR (Quick Response) codes are two-dimensional barcodes that can store
                        comprehensive information about your assets. When scanned with any
                        smartphone or tablet, they instantly provide access to detailed asset
                        information, location history, and management options.
                      </p>
                      <div className="space-y-3">
                        <h5 className="font-medium text-slate-900">Key Benefits:</h5>
                        <ul className="space-y-2 text-sm text-slate-600">
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Instant asset identification and access
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Works with any smartphone camera
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Links directly to comprehensive asset information
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Tracks scan history and location data
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Enables quick status updates and maintenance logs
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                      <div className="w-40 h-40 bg-white border-2 border-dashed border-purple-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <QrCode className="h-20 w-20 text-purple-400" />
                      </div>
                      <p className="text-center text-sm text-purple-700 font-medium">
                        Sample QR Code
                      </p>
                      <p className="text-center text-xs text-purple-600 mt-2">
                        Each asset gets a unique QR code linking to its detailed information page
                      </p>
                    </div>
                  </div>

                  {/* QR Code Generation Process */}
                  <div className="space-y-6">
                    <h4 className="font-semibold text-slate-900 text-lg">
                      How to Generate QR Codes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h5 className="font-medium text-slate-900">Individual QR Codes</h5>
                        <div className="space-y-3">
                          {[
                            'Navigate to your asset details page',
                            "Click the 'Generate QR Code' button",
                            'Choose size and format options (PNG, SVG, PDF)',
                            'Download the QR code image',
                            'Print and attach to the physical asset',
                          ].map((step, index) => (
                            <motion.div
                              key={index}
                              className="flex items-start space-x-3"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-sm text-slate-600">{step}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h5 className="font-medium text-slate-900">Bulk QR Generation</h5>
                        <div className="space-y-3">
                          {[
                            'Go to QR Management page from the main menu',
                            'Select multiple assets using checkboxes',
                            "Click 'Generate QR Codes' for bulk operation",
                            'Choose template and formatting options',
                            'Download as ZIP file containing all codes',
                          ].map((step, index) => (
                            <motion.div
                              key={index}
                              className="flex items-start space-x-3"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-sm text-slate-600">{step}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-purple-200 bg-purple-50">
                    <QrCode className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-purple-800">
                      <strong>QR Code Formats:</strong> Available in PNG (web use), SVG
                      (high-quality printing), and PDF (professional labels). SVG format is
                      recommended for the best print quality and scalability.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* QR Code Scanning */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900">Scanning QR Codes</CardTitle>
                  <CardDescription className="text-slate-600">
                    Learn how to scan QR codes effectively using various devices and methods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          icon: Smartphone,
                          title: 'Built-in Scanner',
                          description:
                            "Use the app's built-in QR scanner for best results and full feature access",
                          color: 'blue',
                        },
                        {
                          icon: Monitor,
                          title: 'Camera App',
                          description:
                            'Most smartphone cameras can scan QR codes directly without additional apps',
                          color: 'green',
                        },
                        {
                          icon: Download,
                          title: 'Third-party Apps',
                          description:
                            'Compatible with popular QR scanner apps available on app stores',
                          color: 'purple',
                        },
                      ].map((method, index) => (
                        <motion.div
                          key={index}
                          className={`p-6 border rounded-xl bg-${method.color}-50 border-${method.color}-200 text-center hover:shadow-lg transition-all duration-200`}
                          whileHover={{ scale: 1.02, y: -4 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div
                            className={`bg-${method.color}-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}
                          >
                            <method.icon className={`h-6 w-6 text-${method.color}-600`} />
                          </div>
                          <h5 className="font-medium text-slate-900 mb-2">{method.title}</h5>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {method.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-3 text-lg">
                        What Happens When You Scan?
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            Instant access to complete asset details
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            Scan location and timestamp automatically recorded
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            Option to update asset status and condition
                          </li>
                        </ul>
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            Add maintenance notes and comments
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            View complete scan and movement history
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            Access maintenance schedules and alerts
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="dashboard">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Dashboard Overview */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-2xl">
                    Understanding Your Dashboard
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Navigate and interpret your asset management dashboard for maximum efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center text-slate-900 text-lg">
                        <BarChart3 className="h-6 w-6 mr-2 text-orange-600" />
                        Key Metrics Overview
                      </h4>
                      <div className="space-y-4">
                        {[
                          {
                            title: 'Total Assets',
                            desc: 'Complete count of all assets in your system across all categories and locations',
                            icon: Package,
                          },
                          {
                            title: 'Active Assets',
                            desc: 'Assets currently in use, available for deployment, or in active rotation',
                            icon: CheckCircle,
                          },
                          {
                            title: 'QR Code Coverage',
                            desc: 'Percentage of assets with generated QR codes for tracking and identification',
                            icon: QrCode,
                          },
                          {
                            title: 'Recent Activity',
                            desc: 'Latest asset movements, updates, scans, and system interactions',
                            icon: Clock,
                          },
                        ].map((metric, index) => (
                          <motion.div
                            key={index}
                            className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            whileHover={{ scale: 1.01 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex items-center mb-2">
                              <metric.icon className="h-5 w-5 text-orange-600 mr-2" />
                              <div className="font-medium text-slate-900">{metric.title}</div>
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed">
                              {metric.desc}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4 text-slate-900 text-lg">Quick Actions</h4>
                      <div className="space-y-3">
                        {[
                          {
                            icon: Package,
                            label: 'Add New Asset',
                            desc: 'Create a new asset entry',
                            color: 'blue',
                          },
                          {
                            icon: QrCode,
                            label: 'Scan QR Code',
                            desc: 'Scan asset QR codes',
                            color: 'purple',
                          },
                          {
                            icon: BarChart3,
                            label: 'View Analytics',
                            desc: 'Access detailed reports',
                            color: 'orange',
                          },
                          {
                            icon: Users,
                            label: 'Manage Team',
                            desc: 'User and permission management',
                            color: 'indigo',
                          },
                          {
                            icon: Download,
                            label: 'Export Data',
                            desc: 'Download reports and data',
                            color: 'green',
                          },
                        ].map((action, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start h-auto p-4 hover:bg-slate-50"
                            >
                              <action.icon className={`h-5 w-5 mr-3 text-${action.color}-600`} />
                              <div className="text-left flex-1">
                                <div className="font-medium text-slate-900">{action.label}</div>
                                <div className="text-xs text-slate-600">{action.desc}</div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-slate-400" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Sections */}
                  <div>
                    <h4 className="font-semibold mb-6 text-slate-900 text-lg">
                      Dashboard Sections
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          title: 'Asset Overview',
                          description:
                            'Summary cards showing key metrics, statistics, and performance indicators about your assets',
                          features: [
                            'Total asset count',
                            'Category breakdown',
                            'Status distribution',
                            'Value summaries',
                          ],
                        },
                        {
                          title: 'Recent Activity',
                          description:
                            'Live feed of recent asset additions, updates, QR code scans, and system interactions',
                          features: [
                            'Asset movements',
                            'Status changes',
                            'QR code scans',
                            'User activities',
                          ],
                        },
                        {
                          title: 'Analytics & Reports',
                          description:
                            'Interactive charts, graphs, and data visualizations for asset performance analysis',
                          features: [
                            'Usage trends',
                            'Location analytics',
                            'Performance metrics',
                            'Custom reports',
                          ],
                        },
                      ].map((section, index) => (
                        <motion.div
                          key={index}
                          className="p-6 border border-slate-200 rounded-xl hover:shadow-lg transition-all duration-200"
                          whileHover={{ scale: 1.02, y: -4 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <h5 className="font-semibold text-slate-900 mb-3">{section.title}</h5>
                          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            {section.description}
                          </p>
                          <ul className="space-y-1">
                            {section.features.map((feature, featureIndex) => (
                              <li
                                key={featureIndex}
                                className="text-xs text-slate-500 flex items-center"
                              >
                                <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Real-time Analytics */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900">Real-time Analytics</CardTitle>
                  <CardDescription className="text-slate-600">
                    Understand how real-time data powers your asset management decisions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-slate-600 leading-relaxed">
                      Your dashboard provides real-time insights into your asset management
                      operations, updating automatically as your team uses the system throughout the
                      day.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h5 className="font-medium text-slate-900 text-lg">Live Metrics</h5>
                        <ul className="space-y-3 text-slate-600">
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            Asset creation and updates in real-time
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            QR code scan frequency and patterns
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                            User activity levels and engagement
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                            System performance and response times
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h5 className="font-medium text-slate-900 text-lg">Interactive Charts</h5>
                        <ul className="space-y-3 text-slate-600">
                          <li className="flex items-center">
                            <BarChart3 className="h-4 w-4 text-blue-600 mr-3" />
                            Asset growth and acquisition trends over time
                          </li>
                          <li className="flex items-center">
                            <BarChart3 className="h-4 w-4 text-green-600 mr-3" />
                            Category distribution and utilization rates
                          </li>
                          <li className="flex items-center">
                            <BarChart3 className="h-4 w-4 text-purple-600 mr-3" />
                            Location-based analytics and heat maps
                          </li>
                          <li className="flex items-center">
                            <BarChart3 className="h-4 w-4 text-orange-600 mr-3" />
                            Usage patterns and maintenance schedules
                          </li>
                        </ul>
                      </div>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Real-time Updates:</strong> Analytics update automatically as you
                        use the system. No need to refresh the page - data flows seamlessly to
                        provide current insights!
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="mt-8 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-slate-900 text-2xl">Next Steps</CardTitle>
              <CardDescription className="text-slate-600 text-lg">
                Now that you understand the basics, here's what to do next to maximize your system's
                potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Explore Advanced Features',
                    desc: 'Learn about bulk operations, integrations, and automation',
                    icon: Rocket,
                    color: 'blue',
                  },
                  {
                    title: 'Set Up Team Access',
                    desc: 'Invite team members and configure permissions',
                    icon: Users,
                    color: 'green',
                  },
                  {
                    title: 'Configure Notifications',
                    desc: 'Set up alerts for important events and maintenance',
                    icon: Settings,
                    color: 'purple',
                  },
                  {
                    title: 'View Video Tutorials',
                    desc: 'Watch step-by-step video guides and best practices',
                    icon: Video,
                    color: 'orange',
                  },
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      className="h-auto p-4 justify-start w-full hover:bg-white/80"
                    >
                      <step.icon className={`h-5 w-5 mr-3 text-${step.color}-600`} />
                      <div className="text-left flex-1">
                        <div className="font-semibold text-slate-900">{step.title}</div>
                        <div className="text-sm text-slate-600">{step.desc}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
