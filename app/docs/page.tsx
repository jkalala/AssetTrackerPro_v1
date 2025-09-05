'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Search,
  Users,
  Code,
  HelpCircle,
  FileText,
  Zap,
  Package,
  QrCode,
  BarChart3,
  Download,
  ExternalLink,
  ChevronRight,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Shield,
} from 'lucide-react'

const documentationSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Quick start guide and basic setup to get you running in minutes',
    icon: Zap,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    hoverColor: 'hover:bg-emerald-100',
    articles: [
      { title: 'System Overview', time: '5 min read', difficulty: 'Beginner', completed: 0 },
      { title: 'First Login & Setup', time: '3 min read', difficulty: 'Beginner', completed: 0 },
      { title: 'Dashboard Navigation', time: '4 min read', difficulty: 'Beginner', completed: 0 },
      {
        title: 'Creating Your First Asset',
        time: '6 min read',
        difficulty: 'Beginner',
        completed: 0,
      },
    ],
  },
  {
    id: 'asset-management',
    title: 'Asset Management',
    description: 'Complete guide to managing your assets efficiently and effectively',
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    articles: [
      { title: 'Adding New Assets', time: '8 min read', difficulty: 'Beginner', completed: 0 },
      {
        title: 'Asset Categories & Classification',
        time: '10 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
      {
        title: 'Asset Lifecycle Management',
        time: '12 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
      { title: 'Bulk Asset Operations', time: '15 min read', difficulty: 'Advanced', completed: 0 },
      {
        title: 'Asset Maintenance Scheduling',
        time: '10 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
      {
        title: 'Asset Depreciation Tracking',
        time: '8 min read',
        difficulty: 'Advanced',
        completed: 0,
      },
    ],
  },
  {
    id: 'qr-codes',
    title: 'QR Code System',
    description: 'Master QR code generation, scanning, and management for seamless tracking',
    icon: QrCode,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:bg-purple-100',
    articles: [
      {
        title: 'QR Code Basics & Benefits',
        time: '5 min read',
        difficulty: 'Beginner',
        completed: 0,
      },
      { title: 'Generating QR Codes', time: '7 min read', difficulty: 'Beginner', completed: 0 },
      { title: 'Scanning QR Codes', time: '6 min read', difficulty: 'Beginner', completed: 0 },
      { title: 'Bulk QR Operations', time: '12 min read', difficulty: 'Advanced', completed: 0 },
      {
        title: 'Custom QR Code Templates',
        time: '8 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
      { title: 'QR Code Analytics', time: '10 min read', difficulty: 'Intermediate', completed: 0 },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reporting',
    description:
      'Harness real-time analytics and comprehensive reporting for data-driven decisions',
    icon: BarChart3,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-100',
    articles: [
      {
        title: 'Dashboard Analytics Overview',
        time: '8 min read',
        difficulty: 'Beginner',
        completed: 0,
      },
      {
        title: 'Real-time Monitoring Setup',
        time: '10 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
      {
        title: 'Custom Reports Creation',
        time: '15 min read',
        difficulty: 'Advanced',
        completed: 0,
      },
      {
        title: 'Data Export & Integration',
        time: '6 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
      {
        title: 'Performance Metrics & KPIs',
        time: '12 min read',
        difficulty: 'Advanced',
        completed: 0,
      },
      {
        title: 'Automated Report Scheduling',
        time: '8 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
    ],
  },
  {
    id: 'user-management',
    title: 'User Management',
    description: 'Manage user accounts, permissions, and team collaboration effectively',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    hoverColor: 'hover:bg-indigo-100',
    articles: [
      {
        title: 'User Roles & Permissions',
        time: '10 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
      {
        title: 'Team Collaboration Features',
        time: '8 min read',
        difficulty: 'Beginner',
        completed: 0,
      },
      {
        title: 'Account Settings & Preferences',
        time: '5 min read',
        difficulty: 'Beginner',
        completed: 0,
      },
      {
        title: 'Security Best Practices',
        time: '12 min read',
        difficulty: 'Advanced',
        completed: 0,
      },
      {
        title: 'Multi-tenant Organization Setup',
        time: '15 min read',
        difficulty: 'Advanced',
        completed: 0,
      },
      {
        title: 'Audit Logs & Compliance',
        time: '10 min read',
        difficulty: 'Intermediate',
        completed: 0,
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Documentation',
    description: 'API reference, integrations, and development guides for developers',
    icon: Code,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverColor: 'hover:bg-red-100',
    articles: [
      {
        title: 'API Reference & Authentication',
        time: '20 min read',
        difficulty: 'Advanced',
        completed: 0,
      },
      {
        title: 'Database Schema & Models',
        time: '15 min read',
        difficulty: 'Advanced',
        completed: 0,
      },
      {
        title: 'Third-party Integration Guide',
        time: '25 min read',
        difficulty: 'Advanced',
        completed: 0,
      },
      {
        title: 'Deployment & Infrastructure',
        time: '30 min read',
        difficulty: 'Expert',
        completed: 0,
      },
      { title: 'Webhook Configuration', time: '12 min read', difficulty: 'Advanced', completed: 0 },
      {
        title: 'Custom Development Guide',
        time: '35 min read',
        difficulty: 'Expert',
        completed: 0,
      },
    ],
  },
]

const popularArticles = [
  { title: 'Creating Your First Asset', views: '2.1k', category: 'Getting Started', trend: '+12%' },
  { title: 'QR Code Generation Guide', views: '1.8k', category: 'QR Codes', trend: '+8%' },
  { title: 'Dashboard Analytics Overview', views: '1.5k', category: 'Analytics', trend: '+15%' },
  { title: 'User Roles & Permissions', views: '1.2k', category: 'User Management', trend: '+5%' },
  { title: 'API Authentication', views: '980', category: 'Technical', trend: '+22%' },
]

const recentUpdates = [
  { title: 'Real-time Analytics Documentation', date: '2 days ago', type: 'New', icon: Sparkles },
  { title: 'QR Code Bulk Operations Guide', date: '1 week ago', type: 'Updated', icon: Target },
  { title: 'API v2.0 Reference', date: '2 weeks ago', type: 'New', icon: Code },
  { title: 'Security Best Practices', date: '3 weeks ago', type: 'Updated', icon: Shield },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const filteredSections = documentationSections.filter(
    section =>
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.articles.some(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <motion.div
        className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-center mb-6"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </motion.div>

            <motion.h1
              className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Asset Management Documentation
            </motion.h1>

            <motion.p
              className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Comprehensive guides, tutorials, and reference materials to help you master your asset
              management system and unlock its full potential for your organization.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              className="max-w-2xl mx-auto relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl shadow-sm"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedSection ? (
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                {/* Quick Start Section */}
                <motion.div variants={itemVariants}>
                  <Card className="mb-8 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-emerald-800 text-2xl">
                        <div className="bg-emerald-600 p-2 rounded-lg mr-3">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                        Quick Start Guide
                      </CardTitle>
                      <CardDescription className="text-emerald-700 text-lg">
                        Get up and running with your asset management system in just a few minutes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            step: '1',
                            title: 'System Overview',
                            desc: 'Learn the basics',
                            time: '5 min',
                          },
                          {
                            step: '2',
                            title: 'Create First Asset',
                            desc: 'Add your first item',
                            time: '3 min',
                          },
                          {
                            step: '3',
                            title: 'Generate QR Code',
                            desc: 'Create tracking codes',
                            time: '4 min',
                          },
                          {
                            step: '4',
                            title: 'View Analytics',
                            desc: 'Monitor your assets',
                            time: '2 min',
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant="outline"
                              className="justify-start h-auto p-4 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 w-full"
                            >
                              <div className="flex items-center w-full">
                                <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm mr-3">
                                  {item.step}
                                </div>
                                <div className="text-left flex-1">
                                  <div className="font-semibold text-slate-900">{item.title}</div>
                                  <div className="text-sm text-slate-600">{item.desc}</div>
                                </div>
                                <div className="text-xs text-emerald-600 font-medium mr-2">
                                  {item.time}
                                </div>
                                <ChevronRight className="h-4 w-4 text-emerald-600" />
                              </div>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Documentation Sections */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                  variants={containerVariants}
                >
                  {filteredSections.map((section, index) => {
                    const IconComponent = section.icon
                    return (
                      <motion.div
                        key={section.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${section.borderColor} ${section.hoverColor} group`}
                          onClick={() => setSelectedSection(section.id)}
                        >
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <div
                                className={`p-3 rounded-xl ${section.bgColor} mr-4 group-hover:scale-110 transition-transform duration-200`}
                              >
                                <IconComponent className={`h-6 w-6 ${section.color}`} />
                              </div>
                              <div>
                                <div className="text-slate-900 group-hover:text-slate-700">
                                  {section.title}
                                </div>
                                <div className="text-sm text-slate-500 font-normal mt-1">
                                  {section.articles.length} articles
                                </div>
                              </div>
                            </CardTitle>
                            <CardDescription className="text-slate-600 leading-relaxed">
                              {section.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {section.articles.slice(0, 3).map((article, articleIndex) => (
                                <div
                                  key={articleIndex}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-slate-700 font-medium">
                                    {article.title}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        article.difficulty === 'Beginner'
                                          ? 'border-green-300 text-green-700'
                                          : article.difficulty === 'Intermediate'
                                            ? 'border-yellow-300 text-yellow-700'
                                            : article.difficulty === 'Advanced'
                                              ? 'border-orange-300 text-orange-700'
                                              : 'border-red-300 text-red-700'
                                      }`}
                                    >
                                      {article.difficulty}
                                    </Badge>
                                    <span className="text-slate-500 text-xs">{article.time}</span>
                                  </div>
                                </div>
                              ))}
                              {section.articles.length > 3 && (
                                <div
                                  className={`text-sm font-medium ${section.color} flex items-center`}
                                >
                                  +{section.articles.length - 3} more articles
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>

                {/* Popular Articles */}
                <motion.div variants={itemVariants}>
                  <Card className="mb-8 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center text-slate-900">
                        <Star className="h-5 w-5 mr-2 text-yellow-500" />
                        Popular Articles
                        <Badge variant="secondary" className="ml-2">
                          Trending
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {popularArticles.map((article, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-200 border border-transparent hover:border-slate-200"
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{article.title}</div>
                                <div className="text-sm text-slate-600">{article.category}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <Badge variant="outline" className="text-xs">
                                  {article.views} views
                                </Badge>
                                <div className="text-xs text-green-600 font-medium mt-1">
                                  {article.trend}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ) : (
              <DocumentationSection
                section={documentationSections.find(s => s.id === selectedSection)!}
                onBack={() => setSelectedSection(null)}
              />
            )}
          </div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Recent Updates */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-sm text-slate-900">
                  <Clock className="h-4 w-4 mr-2" />
                  Recent Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUpdates.map((update, index) => (
                    <motion.div
                      key={index}
                      className="text-sm border-l-2 border-blue-200 pl-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <update.icon className="h-3 w-3 text-blue-600" />
                        <div className="font-medium text-slate-900">{update.title}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">{update.date}</span>
                        <Badge
                          variant={update.type === 'New' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {update.type}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm text-slate-900">Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { icon: Download, label: 'Download PDF Guide', color: 'text-blue-600' },
                    { icon: ExternalLink, label: 'Video Tutorials', color: 'text-purple-600' },
                    { icon: HelpCircle, label: 'Contact Support', color: 'text-green-600' },
                    { icon: FileText, label: 'Release Notes', color: 'text-orange-600' },
                  ].map((link, index) => (
                    <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-slate-100"
                      >
                        <link.icon className={`h-4 w-4 mr-2 ${link.color}`} />
                        {link.label}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm text-blue-900">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-white/60 rounded-lg">
                    <div className="font-medium text-blue-900">Community Forum</div>
                    <div className="text-blue-700">Get help from other users</div>
                  </div>
                  <div className="p-3 bg-white/60 rounded-lg">
                    <div className="font-medium text-blue-900">Email Support</div>
                    <div className="text-blue-700">support@assetmanager.com</div>
                  </div>
                  <div className="p-3 bg-white/60 rounded-lg">
                    <div className="font-medium text-blue-900">Live Chat</div>
                    <div className="text-blue-700">Available 9 AM - 5 PM EST</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function DocumentationSection({ section, onBack }: { section: any; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Button variant="ghost" onClick={onBack} className="mb-6 hover:bg-slate-100">
        ← Back to Documentation
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-900">
            <section.icon className={`h-6 w-6 mr-3 ${section.color}`} />
            {section.title}
          </CardTitle>
          <CardDescription className="text-slate-600">{section.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {section.articles.map((article: any, index: number) => (
              <motion.div
                key={index}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{article.title}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          article.difficulty === 'Beginner'
                            ? 'border-green-300 text-green-700'
                            : article.difficulty === 'Intermediate'
                              ? 'border-yellow-300 text-yellow-700'
                              : article.difficulty === 'Advanced'
                                ? 'border-orange-300 text-orange-700'
                                : 'border-red-300 text-red-700'
                        }`}
                      >
                        {article.difficulty}
                      </Badge>
                      <span className="text-sm text-slate-500">{article.time}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
