/**
 * GraphQL Scalar Resolvers
 * Custom scalar type resolvers
 */

import { GraphQLScalarType, Kind } from 'graphql'

export const scalarResolvers = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'Date custom scalar type',
    serialize(value: Record<string, unknown>) {
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    },
    parseValue(value: Record<string, unknown>) {
      return new Date(value)
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return new Date(ast.value)
      }
      return null
    },
  }),

  JSON: new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON custom scalar type',
    serialize(value: Record<string, unknown>) {
      return value
    },
    parseValue(value: Record<string, unknown>) {
      return value
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        try {
          return JSON.parse(ast.value)
        } catch {
          return null
        }
      }
      return null
    },
  }),

  Upload: new GraphQLScalarType({
    name: 'Upload',
    description: 'File upload scalar type',
    serialize: () => {
      throw new Error('Upload serialization not supported')
    },
    parseValue: (value: Record<string, unknown>) => value,
    parseLiteral: () => {
      throw new Error('Upload literal parsing not supported')
    },
  }),

  Decimal: new GraphQLScalarType({
    name: 'Decimal',
    description: 'Decimal number scalar type',
    serialize(value: Record<string, unknown>) {
      return parseFloat(value as string)
    },
    parseValue(value: Record<string, unknown>) {
      return parseFloat(value as string)
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
        return parseFloat(ast.value)
      }
      return null
    },
  }),
}