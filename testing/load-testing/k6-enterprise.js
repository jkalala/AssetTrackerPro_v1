/**
 * Enterprise Load Testing Configuration for AssetTrackerPro
 * K6 performance testing for government and enterprise scale
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'

// Custom metrics for enterprise monitoring
const errorRate = new Rate('error_rate')
const responseTime = new Trend('response_time')
const apiCalls = new Counter('api_calls')
const concurrentUsers = new Counter('concurrent_users')

// Test configuration for different enterprise scenarios
export const options = {
  scenarios: {
    // Government agency scenario - 1000 concurrent users
    government_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },   // Ramp up
        { duration: '10m', target: 500 },  // Normal load
        { duration: '5m', target: 1000 },  // Peak load
        { duration: '10m', target: 1000 }, // Sustained peak
        { duration: '5m', target: 0 }      // Ramp down
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'government' }
    },

    // Enterprise scenario - 2000 concurrent users
    enterprise_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10m', target: 200 },  // Ramp up
        { duration: '20m', target: 1000 }, // Normal load
        { duration: '10m', target: 2000 }, // Peak load
        { duration: '20m', target: 2000 }, // Sustained peak
        { duration: '10m', target: 0 }     // Ramp down
      ],
      gracefulRampDown: '60s',
      tags: { scenario: 'enterprise' }
    },

    // Educational institution scenario - 5000 concurrent users
    education_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15m', target: 500 },  // Ramp up
        { duration: '30m', target: 2500 }, // Normal load
        { duration: '15m', target: 5000 }, // Peak load (semester start)
        { duration: '30m', target: 5000 }, // Sustained peak
        { duration: '15m', target: 0 }     // Ramp down
      ],
      gracefulRampDown: '120s',
      tags: { scenario: 'education' }
    },

    // Stress testing - Find breaking point
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 10000,
      stages: [
        { duration: '5m', target: 100 },   // 100 RPS
        { duration: '10m', target: 500 },  // 500 RPS
        { duration: '5m', target: 1000 },  // 1000 RPS
        { duration: '5m', target: 2000 },  // 2000 RPS
        { duration: '5m', target: 0 }      // Ramp down
      ],
      tags: { scenario: 'stress' }
    },

    // Spike testing - Sudden load increases
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '2m', target: 100 },   // Normal load
        { duration: '30s', target: 2000 }, // Sudden spike
        { duration: '2m', target: 2000 },  // Sustained spike
        { duration: '30s', target: 100 },  // Back to normal
        { duration: '2m', target: 100 }    // Recovery
      ],
      tags: { scenario: 'spike' }
    }
  },

  // Performance thresholds for enterprise requirements
  thresholds: {
    // Response time requirements
    'http_req_duration': [
      'p(95)<2000',  // 95% of requests under 2s
      'p(99)<5000'   // 99% of requests under 5s
    ],
    
    // Error rate requirements
    'http_req_failed': ['rate<0.01'], // Less than 1% error rate
    
    // Custom metrics thresholds
    'error_rate': ['rate<0.01'],
    'response_time': ['p(95)<2000'],
    
    // Scenario-specific thresholds
    'http_req_duration{scenario:government}': ['p(95)<1500'],
    'http_req_duration{scenario:enterprise}': ['p(95)<2000'],
    'http_req_duration{scenario:education}': ['p(95)<3000']
  }
}

// Test data for realistic scenarios
const testData = {
  users: [
    { email: 'admin@government.gov', password: 'SecurePass123!', role: 'admin' },
    { email: 'manager@enterprise.com', password: 'SecurePass123!', role: 'manager' },
    { email: 'teacher@university.edu', password: 'SecurePass123!', role: 'user' }
  ],
  
  assets: [
    { name: 'Government Laptop', category: 'IT Equipment', value: 1500 },
    { name: 'Enterprise Server', category: 'Infrastructure', value: 25000 },
    { name: 'Classroom Projector', category: 'AV Equipment', value: 800 }
  ]
}

// Authentication helper
function authenticate(baseUrl, credentials) {
  const loginResponse = http.post(`${baseUrl}/api/auth/login`, JSON.stringify(credentials), {
    headers: { 'Content-Type': 'application/json' }
  })
  
  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'received auth token': (r) => r.json('token') !== undefined
  })
  
  return loginResponse.json('token')
}

// Main test function
export default function() {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000'
  const userIndex = Math.floor(Math.random() * testData.users.length)
  const user = testData.users[userIndex]
  
  concurrentUsers.add(1)
  
  group('Authentication Flow', () => {
    const token = authenticate(baseUrl, user)
    
    if (!token) {
      errorRate.add(1)
      return
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    group('Dashboard Operations', () => {
      // Load dashboard
      const dashboardStart = Date.now()
      const dashboardResponse = http.get(`${baseUrl}/api/dashboard`, { headers })
      const dashboardTime = Date.now() - dashboardStart
      
      responseTime.add(dashboardTime)
      apiCalls.add(1)
      
      check(dashboardResponse, {
        'dashboard loaded': (r) => r.status === 200,
        'dashboard response time OK': (r) => r.timings.duration < 2000
      })
      
      sleep(1)
    })
    
    group('Asset Management Operations', () => {
      // List assets
      const assetsStart = Date.now()
      const assetsResponse = http.get(`${baseUrl}/api/assets`, { headers })
      const assetsTime = Date.now() - assetsStart
      
      responseTime.add(assetsTime)
      apiCalls.add(1)
      
      check(assetsResponse, {
        'assets listed': (r) => r.status === 200,
        'assets response time OK': (r) => r.timings.duration < 3000
      })
      
      // Create asset (10% of users)
      if (Math.random() < 0.1) {
        const assetData = testData.assets[Math.floor(Math.random() * testData.assets.length)]
        const createStart = Date.now()
        const createResponse = http.post(`${baseUrl}/api/assets`, JSON.stringify(assetData), { headers })
        const createTime = Date.now() - createStart
        
        responseTime.add(createTime)
        apiCalls.add(1)
        
        check(createResponse, {
          'asset created': (r) => r.status === 201,
          'create response time OK': (r) => r.timings.duration < 5000
        })
      }
      
      sleep(2)
    })
    
    group('Analytics Operations', () => {
      // Load analytics
      const analyticsStart = Date.now()
      const analyticsResponse = http.get(`${baseUrl}/api/analytics`, { headers })
      const analyticsTime = Date.now() - analyticsStart
      
      responseTime.add(analyticsTime)
      apiCalls.add(1)
      
      check(analyticsResponse, {
        'analytics loaded': (r) => r.status === 200,
        'analytics response time OK': (r) => r.timings.duration < 4000
      })
      
      sleep(1)
    })
    
    group('Search Operations', () => {
      // Search assets
      const searchStart = Date.now()
      const searchResponse = http.get(`${baseUrl}/api/assets/search?q=laptop`, { headers })
      const searchTime = Date.now() - searchStart
      
      responseTime.add(searchTime)
      apiCalls.add(1)
      
      check(searchResponse, {
        'search completed': (r) => r.status === 200,
        'search response time OK': (r) => r.timings.duration < 2000
      })
      
      sleep(1)
    })
  })
  
  // Random think time between 1-5 seconds
  sleep(Math.random() * 4 + 1)
}

// Custom report generation
export function handleSummary(data) {
  return {
    'test-results/load-test-summary.html': htmlReport(data),
    'test-results/load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  }
}

// Setup function for test initialization
export function setup() {
  console.log('Starting enterprise load testing...')
  console.log(`Base URL: ${__ENV.BASE_URL || 'http://localhost:3000'}`)
  console.log(`Test duration: ${__ENV.DURATION || 'default'}`)
  
  return {
    startTime: new Date().toISOString(),
    testConfig: options
  }
}

// Teardown function for cleanup
export function teardown(data) {
  console.log('Load testing completed.')
  console.log(`Test started at: ${data.startTime}`)
  console.log(`Test completed at: ${new Date().toISOString()}`)
}
