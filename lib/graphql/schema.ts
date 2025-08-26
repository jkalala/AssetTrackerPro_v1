/**
 * GraphQL Schema Definition for Enterprise Asset Management Platform
 * Provides comprehensive API access with tenant-scoped resolvers
 */

import { gql } from 'graphql-tag'

export const typeDefs = gql`
  # Scalars
  scalar DateTime
  scalar JSON
  scalar Upload
  scalar Decimal

  # Enums
  enum AssetStatus {
    ACTIVE
    INACTIVE
    MAINTENANCE
    RETIRED
    DISPOSED
  }

  enum UserRole {
    SUPER_ADMIN
    TENANT_ADMIN
    MANAGER
    USER
    VIEWER
    GUEST
  }

  enum IntegrationType {
    ERP_SAP
    ERP_ORACLE
    ERP_DYNAMICS
    CMMS_MAXIMO
    CMMS_MAINTENANCE_CONNECTION
    LDAP
    ACTIVE_DIRECTORY
    WEBHOOK
  }

  # Core Types
  type Tenant {
    id: ID!
    name: String!
    slug: String!
    status: String!
    plan: String!
    settings: JSON
    branding: JSON
    dataResidency: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    assets(
      first: Int
      after: String
      filter: AssetFilter
      sort: AssetSort
    ): AssetConnection!
    
    users(
      first: Int
      after: String
      filter: UserFilter
    ): UserConnection!
    
    integrations: [Integration!]!
    webhooks: [Webhook!]!
  }

  type Asset {
    id: ID!
    tenantId: ID!
    assetId: String!
    name: String!
    description: String
    category: AssetCategory
    status: AssetStatus!
    location: Location
    assignee: User
    parentAsset: Asset
    childAssets: [Asset!]!
    
    # Financial Information
    purchasePrice: Decimal
    currentValue: Decimal
    depreciationMethod: String
    depreciationRate: Decimal
    
    # Lifecycle Information
    purchaseDate: DateTime
    warrantyExpiry: DateTime
    lastMaintenanceDate: DateTime
    nextMaintenanceDate: DateTime
    retirementDate: DateTime
    
    # Technical Information
    specifications: JSON
    customFields: JSON
    
    # Tracking Information
    qrCode: String
    rfidTag: String
    barcode: String
    
    # IoT Integration
    iotDevices: [IoTDevice!]!
    sensorData(
      from: DateTime
      to: DateTime
      sensorType: String
    ): [SensorReading!]!
    
    # Audit Information
    createdBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Analytics
    utilizationMetrics(period: String!): UtilizationMetrics
    maintenanceHistory: [MaintenanceRecord!]!
    locationHistory(
      from: DateTime
      to: DateTime
    ): [LocationHistory!]!
  }

  type User {
    id: ID!
    tenantId: ID!
    email: String!
    firstName: String
    lastName: String
    role: UserRole!
    department: Department
    permissions: [Permission!]!
    isActive: Boolean!
    lastLoginAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # Relationships
    assignedAssets: [Asset!]!
    delegations: [PermissionDelegation!]!
  }

  type AssetCategory {
    id: ID!
    tenantId: ID!
    name: String!
    description: String
    parentCategory: AssetCategory
    childCategories: [AssetCategory!]!
    customFields: [CustomField!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Location {
    id: ID!
    name: String!
    address: String
    coordinates: Coordinates
    geofences: [Geofence!]!
    parentLocation: Location
    childLocations: [Location!]!
  }

  type Coordinates {
    latitude: Float!
    longitude: Float!
    altitude: Float
    accuracy: Float
  }

  type IoTDevice {
    id: ID!
    tenantId: ID!
    assetId: ID!
    deviceId: String!
    deviceType: String!
    protocol: String!
    configuration: JSON
    lastSeen: DateTime
    status: String!
    createdAt: DateTime!
    
    # Real-time data
    currentSensorReadings: [SensorReading!]!
  }

  type SensorReading {
    id: ID!
    deviceId: ID!
    sensorType: String!
    value: Decimal!
    unit: String
    timestamp: DateTime!
    metadata: JSON
  }

  type Integration {
    id: ID!
    tenantId: ID!
    name: String!
    type: IntegrationType!
    configuration: JSON!
    status: String!
    lastSyncAt: DateTime
    nextSyncAt: DateTime
    syncResults: [SyncResult!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Webhook {
    id: ID!
    tenantId: ID!
    name: String!
    url: String!
    events: [String!]!
    secret: String
    isActive: Boolean!
    retryPolicy: RetryPolicy!
    deliveryAttempts: [WebhookDelivery!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WebhookDelivery {
    id: ID!
    webhookId: ID!
    eventType: String!
    payload: JSON!
    status: String!
    responseCode: Int
    responseBody: String
    attemptNumber: Int!
    deliveredAt: DateTime
    nextRetryAt: DateTime
    createdAt: DateTime!
  }

  type RetryPolicy {
    maxAttempts: Int!
    backoffMultiplier: Float!
    initialDelay: Int!
    maxDelay: Int!
  }

  # Connection Types for Pagination
  type AssetConnection {
    edges: [AssetEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AssetEdge {
    node: Asset!
    cursor: String!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Input Types
  input AssetFilter {
    status: [AssetStatus!]
    categoryId: ID
    assigneeId: ID
    locationId: ID
    search: String
    dateRange: DateRangeInput
    customFields: JSON
  }

  input AssetSort {
    field: AssetSortField!
    direction: SortDirection!
  }

  enum AssetSortField {
    NAME
    CREATED_AT
    UPDATED_AT
    PURCHASE_DATE
    CURRENT_VALUE
  }

  enum SortDirection {
    ASC
    DESC
  }

  input UserFilter {
    role: [UserRole!]
    departmentId: ID
    isActive: Boolean
    search: String
  }

  input DateRangeInput {
    from: DateTime!
    to: DateTime!
  }

  input CreateAssetInput {
    assetId: String!
    name: String!
    description: String
    categoryId: ID
    locationId: ID
    assigneeId: ID
    parentAssetId: ID
    purchasePrice: Decimal
    purchaseDate: DateTime
    warrantyExpiry: DateTime
    specifications: JSON
    customFields: JSON
    qrCode: String
    rfidTag: String
    barcode: String
  }

  input UpdateAssetInput {
    name: String
    description: String
    categoryId: ID
    status: AssetStatus
    locationId: ID
    assigneeId: ID
    currentValue: Decimal
    specifications: JSON
    customFields: JSON
  }

  input CreateIntegrationInput {
    name: String!
    type: IntegrationType!
    configuration: JSON!
  }

  input CreateWebhookInput {
    name: String!
    url: String!
    events: [String!]!
    secret: String
    retryPolicy: RetryPolicyInput
  }

  input RetryPolicyInput {
    maxAttempts: Int!
    backoffMultiplier: Float!
    initialDelay: Int!
    maxDelay: Int!
  }

  # Queries
  type Query {
    # Tenant Operations
    tenant: Tenant
    
    # Asset Operations
    asset(id: ID!): Asset
    assets(
      first: Int = 20
      after: String
      filter: AssetFilter
      sort: AssetSort
    ): AssetConnection!
    
    # User Operations
    user(id: ID!): User
    users(
      first: Int = 20
      after: String
      filter: UserFilter
    ): UserConnection!
    
    # Integration Operations
    integration(id: ID!): Integration
    integrations: [Integration!]!
    
    # Webhook Operations
    webhook(id: ID!): Webhook
    webhooks: [Webhook!]!
    
    # Analytics
    assetAnalytics(
      filter: AssetFilter
      period: String!
    ): AssetAnalytics!
    
    # Search
    search(
      query: String!
      types: [String!]
      limit: Int = 10
    ): SearchResults!
  }

  # Mutations
  type Mutation {
    # Asset Operations
    createAsset(input: CreateAssetInput!): Asset!
    updateAsset(id: ID!, input: UpdateAssetInput!): Asset!
    deleteAsset(id: ID!): Boolean!
    
    # Integration Operations
    createIntegration(input: CreateIntegrationInput!): Integration!
    updateIntegration(id: ID!, input: JSON!): Integration!
    deleteIntegration(id: ID!): Boolean!
    triggerSync(integrationId: ID!): SyncResult!
    
    # Webhook Operations
    createWebhook(input: CreateWebhookInput!): Webhook!
    updateWebhook(id: ID!, input: JSON!): Webhook!
    deleteWebhook(id: ID!): Boolean!
    testWebhook(id: ID!): WebhookDelivery!
    
    # Bulk Operations
    bulkCreateAssets(input: [CreateAssetInput!]!): BulkOperationResult!
    bulkUpdateAssets(input: [BulkUpdateAssetInput!]!): BulkOperationResult!
    bulkDeleteAssets(ids: [ID!]!): BulkOperationResult!
  }

  # Subscriptions for Real-time Updates
  type Subscription {
    # Asset Updates
    assetUpdated(tenantId: ID!): Asset!
    assetCreated(tenantId: ID!): Asset!
    assetDeleted(tenantId: ID!): ID!
    
    # IoT Data
    sensorDataReceived(deviceId: ID!): SensorReading!
    
    # Integration Events
    syncCompleted(integrationId: ID!): SyncResult!
    
    # Webhook Events
    webhookDelivered(webhookId: ID!): WebhookDelivery!
  }

  # Additional Types
  type AssetAnalytics {
    totalAssets: Int!
    assetsByStatus: [StatusCount!]!
    assetsByCategory: [CategoryCount!]!
    utilizationRate: Float!
    maintenanceOverdue: Int!
    totalValue: Decimal!
    depreciationTrend: [DepreciationPoint!]!
  }

  type StatusCount {
    status: AssetStatus!
    count: Int!
  }

  type CategoryCount {
    category: AssetCategory!
    count: Int!
  }

  type DepreciationPoint {
    date: DateTime!
    value: Decimal!
  }

  type SearchResults {
    assets: [Asset!]!
    users: [User!]!
    locations: [Location!]!
    totalResults: Int!
  }

  type SyncResult {
    id: ID!
    integrationId: ID!
    status: String!
    recordsProcessed: Int!
    recordsSucceeded: Int!
    recordsFailed: Int!
    errors: [String!]!
    startedAt: DateTime!
    completedAt: DateTime
  }

  type BulkOperationResult {
    totalRecords: Int!
    successfulRecords: Int!
    failedRecords: Int!
    errors: [BulkOperationError!]!
  }

  type BulkOperationError {
    index: Int!
    message: String!
    field: String
  }

  input BulkUpdateAssetInput {
    id: ID!
    updates: UpdateAssetInput!
  }

  # Additional types for comprehensive coverage
  type Department {
    id: ID!
    tenantId: ID!
    name: String!
    description: String
    parentDepartment: Department
    childDepartments: [Department!]!
    users: [User!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Permission {
    id: ID!
    name: String!
    description: String!
    resource: String!
    action: String!
  }

  type PermissionDelegation {
    id: ID!
    delegatorId: ID!
    delegateeId: ID!
    permissions: [Permission!]!
    expiresAt: DateTime
    isActive: Boolean!
    createdAt: DateTime!
  }

  type CustomField {
    id: ID!
    name: String!
    type: String!
    required: Boolean!
    options: [String!]
    validation: JSON
  }

  type Geofence {
    id: ID!
    tenantId: ID!
    name: String!
    coordinates: [Coordinates!]!
    radius: Float
    isActive: Boolean!
    createdAt: DateTime!
  }

  type UtilizationMetrics {
    utilizationRate: Float!
    activeHours: Float!
    idleHours: Float!
    maintenanceHours: Float!
    period: String!
  }

  type MaintenanceRecord {
    id: ID!
    assetId: ID!
    type: String!
    description: String!
    performedBy: User!
    performedAt: DateTime!
    cost: Decimal
    nextMaintenanceDate: DateTime
  }

  type LocationHistory {
    id: ID!
    assetId: ID!
    location: Location!
    coordinates: Coordinates
    timestamp: DateTime!
    source: String!
  }
`