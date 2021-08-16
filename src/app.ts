import { PubSub } from 'graphql-subscriptions';

import { BuildContextArgs, CreateApp, InferContext } from '@graphql-ez/fastify';
import { ezCodegen } from '@graphql-ez/plugin-codegen';
import { ezGraphiQLIDE } from '@graphql-ez/plugin-graphiql';
import { ezScalars } from '@graphql-ez/plugin-scalars';
import { ezSchema } from '@graphql-ez/plugin-schema';
import { ezWebSockets } from '@graphql-ez/plugin-websockets';
import { PrismaClient } from '@prisma/client';

import { getUserId } from './utils.js';

// Initialize a pubsub instance to emit events to be used for GraphQL Subscriptions

export const pubsub = new PubSub();

// Initialize the prisma client object - Prisma will be used as the ORM to access the underlying SQLITE database

const prisma = new PrismaClient({
  errorFormat: 'minimal',
});

// Context Factory to build the context object in GraphQL Server

function buildContext({ req }: BuildContextArgs) {
  return {
    req,
    prisma,
    pubsub,
    userId:
      req && req.headers.authorization
        ? getUserId(req.headers.authorization)
        : null,
  };
}

// Leverage Typescript augmentation
declare module 'graphql-ez' {
  interface EZContext extends InferContext<typeof buildContext> {}
}

// Create GraphQL APP by bootstrapping it with the plugins we need (GraphiQL, GraphQL Scalars, GraphQL WS)

export const ezApp = CreateApp({
  buildContext,
  ez: {
    plugins: [
      ezSchema({}),
      ezGraphiQLIDE(),
      ezScalars({
        DateTime: 1,
      }),
      ezWebSockets('adaptive'),
      ezCodegen({
        config: {
          scalars: {
            ID: 'number',
          },
        },
      }),
    ],
  },
  async prepare() {
    await import('./modules/index.js');
  },
});

export const { registerTypeDefs, registerResolvers, gql } = ezApp;
