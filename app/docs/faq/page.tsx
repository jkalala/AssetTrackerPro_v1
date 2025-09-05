'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  HelpCircle,
  Search,
  MessageCircle,
  Mail,
  Phone,
  CheckCircle,
  ExternalLink,
  Clock,
  Package,
  QrCode,
  BarChart3,
  Settings,
} from 'lucide-react'

const faqCategories = [
  {
    id: 'general',
    title: 'General Questions',
    icon: HelpCircle,
    color: 'text-blue-600',
    questions: [
      {
        question: 'What is an Asset Management System?',
        answer:
          'An Asset Management System is a comprehensive platform that helps organizations track, manage, and optimize their physical and digital assets throughout their lifecycle. It provides tools for asset registration, location tracking, maintenance scheduling, and performance analytics.',
        tags: ['basics', 'overview'],
      },
      {
        question: 'How do I get started with the system?',
        answer:
          'Getting started is easy! First, complete your profile setup, then add your first asset, generate a QR code, and explore the dashboard. Our Getting Started guide provides step-by-step instructions for new users.',
        tags: ['setup', 'beginner'],
      },
      {
        question: 'Is my data secure?',
        answer:
          'Yes, we take security seriously. All data is encrypted in transit and at rest, we use industry-standard authentication methods, and our infrastructure is regularly audited for security compliance. We also provide role-based access controls to ensure only authorized users can access sensitive information.',
        tags: ['security', 'privacy'],
      },
      {
        question: 'Can I import existing asset data?',
        answer:
          'You can import your existing asset data using our bulk import feature. We support CSV, Excel, and JSON formats. Our import wizard will guide you through the process and help map your existing fields to our system.',
        tags: ['import', 'migration'],
      },
    ],
  },
  {
    id: 'assets',
    title: 'Asset Management',
    icon: Package,
    color: 'text-green-600',
    questions: [
      {
        question: 'How many assets can I add to the system?',
        answer:
          "There's no limit to the number of assets you can add. Our system is designed to scale from small businesses with dozens of assets to large enterprises with thousands of items.",
        tags: ['limits', 'scaling'],
      },
      {
        question: 'Can I customize asset categories?',
        answer:
          "Yes, you can create custom categories that match your organization's needs. Go to Settings > Categories to add, edit, or remove asset categories. You can also create subcategories for better organization.",
        tags: ['customization', 'categories'],
      },
      {
        question: 'How do I track asset location changes?',
        answer:
          'Asset locations are automatically tracked when you update them in the system or scan QR codes from different locations. The system maintains a complete location history for each asset, showing when and where it was moved.',
        tags: ['location', 'tracking'],
      },
      {
        question: 'Can I add custom fields to assets?',
        answer:
          'Yes, you can add custom fields to capture additional information specific to your organization. Custom fields support various data types including text, numbers, dates, and dropdown selections.',
        tags: ['customization', 'fields'],
      },
    ],
  },
  {
    id: 'qr-codes',
    title: 'QR Codes',
    icon: QrCode,
    color: 'text-purple-600',
    questions: [
      {
        question: 'Do I need special equipment to scan QR codes?',
        answer:
          'No special equipment is needed! QR codes can be scanned using any smartphone or tablet camera. Most modern devices have built-in QR code scanning capabilities, or you can use our web-based scanner.',
        tags: ['scanning', 'equipment'],
      },
      {
        question: 'What happens if a QR code gets damaged?',
        answer:
          'If a QR code becomes damaged or unreadable, you can easily generate a new one from the asset details page. The old QR code will be deactivated, and the new one will be linked to the same asset.',
        tags: ['maintenance', 'replacement'],
      },
      {
        question: 'Can I customize the appearance of QR codes?',
        answer:
          'Yes, you can customize QR code size, add your company logo, and choose from different label templates. We also offer various formats (PNG, SVG, PDF) for different printing needs.',
        tags: ['customization', 'branding'],
      },
      {
        question: 'How do I print QR codes in bulk?',
        answer:
          'Use our bulk QR generation feature to create multiple QR codes at once. You can select multiple assets, generate their QR codes, and download them as a ZIP file containing individual images or a single PDF with multiple codes.',
        tags: ['bulk', 'printing'],
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    icon: BarChart3,
    color: 'text-orange-600',
    questions: [
      {
        question: 'How often are analytics updated?',
        answer:
          'Analytics are updated in real-time as you use the system. Dashboard metrics, charts, and reports reflect the most current data without needing to refresh the page.',
        tags: ['real-time', 'updates'],
      },
      {
        question: 'Can I export reports to Excel?',
        answer:
          'Yes, all reports can be exported in multiple formats including Excel (.xlsx), CSV, PDF, and JSON. You can also schedule automatic report generation and delivery via email.',
        tags: ['export', 'formats'],
      },
      {
        question: 'What metrics are tracked automatically?',
        answer:
          'The system automatically tracks asset creation dates, location changes, QR code scans, user activity, maintenance schedules, and utilization patterns. All this data is used to generate comprehensive analytics.',
        tags: ['metrics', 'tracking'],
      },
      {
        question: 'Can I create custom dashboards?',
        answer:
          'Yes, you can create custom dashboards with the specific metrics and charts that matter most to your organization. Drag and drop widgets to build personalized views for different roles and departments.',
        tags: ['customization', 'dashboards'],
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: Settings,
    color: 'text-red-600',
    questions: [
      {
        question: 'What browsers are supported?',
        answer:
          'We support all modern browsers including Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+. For the best experience, we recommend using the latest version of Chrome or Firefox.',
        tags: ['browsers', 'compatibility'],
      },
      {
        question: 'Is there a mobile app?',
        answer:
          "While we don't have a dedicated mobile app yet, our web application is fully responsive and works excellently on mobile devices. You can add it to your home screen for app-like experience.",
        tags: ['mobile', 'app'],
      },
      {
        question: 'How do I integrate with other systems?',
        answer:
          'We provide a comprehensive REST API for integrating with other systems. Documentation, SDKs, and example code are available in our API documentation section. We also support webhooks for real-time data synchronization.',
        tags: ['api', 'integration'],
      },
      {
        question: 'What if I encounter a bug or error?',
        answer:
          'If you encounter any issues, please contact our support team with details about the error, including screenshots if possible. We typically respond within 24 hours and provide regular updates on bug fixes.',
        tags: ['bugs', 'support'],
      },
    ],
  },
]

const supportOptions = [
  {
    title: 'Email Support',
    description: 'Get help via email with detailed responses',
    contact: 'support@assetmanager.com',
    responseTime: 'Within 24 hours',
    icon: Mail,
    color: 'text-blue-600',
  },
  {
    title: 'Live Chat',
    description: 'Real-time assistance during business hours',
    contact: 'Available 9 AM - 5 PM EST',
    responseTime: 'Immediate',
    icon: MessageCircle,
    color: 'text-green-600',
  },
  {
    title: 'Phone Support',
    description: 'Direct phone support for urgent issues',
    contact: '+1 (555) 123-4567',
    responseTime: 'Business hours only',
    icon: Phone,
    color: 'text-purple-600',
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredQuestions = faqCategories.flatMap(category =>
    category.questions
      .filter(
        q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(q => ({ ...q, category: category.title, categoryId: category.id }))
  )

  const displayQuestions = selectedCategory
    ? faqCategories.find(c => c.id === selectedCategory)?.questions || []
    : searchQuery
      ? filteredQuestions
      : []

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <HelpCircle className="h-10 w-10 mr-4 text-blue-600" />
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Find answers to common questions about your Asset Management System
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">50+</div>
              <div className="text-sm text-gray-600">FAQ Articles</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">24h</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">99%</div>
              <div className="text-sm text-gray-600">Issues Resolved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-orange-600">5★</div>
              <div className="text-sm text-gray-600">Support Rating</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Browse by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {faqCategories.map(category => {
                    const IconComponent = category.icon
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setSearchQuery('')
                        }}
                      >
                        <IconComponent className={`h-4 w-4 mr-2 ${category.color}`} />
                        {category.title}
                        <Badge variant="outline" className="ml-auto">
                          {category.questions.length}
                        </Badge>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Support Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need More Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportOptions.map((option, index) => {
                    const IconComponent = option.icon
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center mb-2">
                          <IconComponent className={`h-4 w-4 mr-2 ${option.color}`} />
                          <span className="font-medium text-sm">{option.title}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{option.description}</p>
                        <p className="text-xs font-medium">{option.contact}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {option.responseTime}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedCategory && !searchQuery && (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to our Help Center</CardTitle>
                  <CardDescription>
                    Select a category from the sidebar or use the search bar to find answers to your
                    questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faqCategories.slice(0, 4).map(category => {
                      const IconComponent = category.icon
                      return (
                        <div
                          key={category.id}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <div className="flex items-center mb-2">
                            <IconComponent className={`h-6 w-6 mr-3 ${category.color}`} />
                            <h3 className="font-semibold">{category.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {category.questions.length} articles
                          </p>
                          <p className="text-xs text-gray-500">{category.questions[0]?.question}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {(selectedCategory || searchQuery) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {searchQuery
                      ? `Search Results for "${searchQuery}"`
                      : faqCategories.find(c => c.id === selectedCategory)?.title}
                  </CardTitle>
                  <CardDescription>
                    {searchQuery
                      ? `Found ${filteredQuestions.length} results`
                      : `${displayQuestions.length} frequently asked questions`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {displayQuestions.length === 0 ? (
                    <div className="text-center py-8">
                      <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-600 mb-4">
                        Try adjusting your search terms or browse our categories
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory(null)
                        }}
                      >
                        Browse All Categories
                      </Button>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-2">
                      {displayQuestions.map((item, index) => (
                        <AccordionItem
                          key={index}
                          value={`item-${index}`}
                          className="border rounded-lg px-4"
                        >
                          <AccordionTrigger className="text-left hover:no-underline">
                            <div className="flex items-start space-x-3">
                              <div className="flex-1">
                                <h3 className="font-medium">{item.question}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  {searchQuery && 'category' in item && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.category}
                                    </Badge>
                                  )}
                                  {item.tags.map((tag, tagIndex) => (
                                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-6">
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                  Helpful
                                </span>
                                <span className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Updated recently
                                </span>
                              </div>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Learn More
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Contact Support Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <CardDescription>
              Our support team is here to help you succeed with your asset management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {supportOptions.map((option, index) => {
                const IconComponent = option.icon
                return (
                  <div key={index} className="text-center p-6 border rounded-lg">
                    <div
                      className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4`}
                    >
                      <IconComponent className={`h-6 w-6 ${option.color}`} />
                    </div>
                    <h3 className="font-semibold mb-2">{option.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                    <p className="font-medium text-sm mb-2">{option.contact}</p>
                    <Badge variant="outline">{option.responseTime}</Badge>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      Contact Now
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Helpful Resources */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 justify-start">
                <div className="text-left">
                  <div className="font-semibold">Video Tutorials</div>
                  <div className="text-sm text-gray-600">Step-by-step guides</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4 justify-start">
                <div className="text-left">
                  <div className="font-semibold">User Guide</div>
                  <div className="text-sm text-gray-600">Comprehensive manual</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4 justify-start">
                <div className="text-left">
                  <div className="font-semibold">API Documentation</div>
                  <div className="text-sm text-gray-600">Developer resources</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4 justify-start">
                <div className="text-left">
                  <div className="font-semibold">Community Forum</div>
                  <div className="text-sm text-gray-600">User discussions</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
