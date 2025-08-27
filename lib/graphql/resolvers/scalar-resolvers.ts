/**
 * GraphQL Scalar Resolvers
 * Custom scalar type resolvers
 */

import { GraphQLScalarType, Kind } from 'graphql'

export const scalarResolvers = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'Date custom scalar type',
    serialize(value: any) {
      if (value instanceof Date) {
        return value.toISOString()
      }
      return value
    },
    parseValue(value: any) {
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
    serialize(value: any) {
      return value
    },
    parseValue(value: any) {
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
    parseValue: (value: any) => value,
    parseLiteral: () => {
      throw new Error('Upload literal parsing not supported')
    },
  }),

  Decimal: new GraphQLScalarType({
    name: 'Decimal',
    description: 'Decimal number scalar type',
    serialize(value: any) {
      return parseFloat(value as string)
    },
    parseValue(value: any) {
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