/**
 * GraphQL API Endpoint
 * Handles GraphQL queries, mutations, and subscriptions
 */

import { handler } from '../../../lib/graphql/server'

export { handler as GET, handler as POST }