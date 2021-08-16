import { registerResolvers, registerTypeDefs, gql } from '../app';

registerTypeDefs(gql`
  type Feed {
    id: ID!
    links: [Link!]!
    count: Int!
  }

  enum Sort {
    asc
    desc
  }

  input LinkOrderByInput {
    description: Sort
    url: Sort
    createdAt: Sort
  }

  extend type Query {
    feed(filter: String, skip: Int, take: Int, orderBy: LinkOrderByInput): Feed!
  }
`);

registerResolvers({
  Query: {
    async feed(parent, args, context, info) {
      const where = args.filter
        ? {
            OR: [
              { description: { contains: args.filter } },
              { url: { contains: args.filter } },
            ],
          }
        : {};

      const links = await context.prisma.link.findMany({
        where,
        skip: args.skip ?? undefined,
        take: args.take ?? undefined,
        orderBy: args.orderBy
          ? {
              description: args.orderBy.description ?? undefined,
              url: args.orderBy.url ?? undefined,
              createdAt: args.orderBy.createdAt ?? undefined,
            }
          : undefined,
      });

      const count = await context.prisma.link.count({ where });

      return {
        id: 'main-feed',
        links,
        count,
      };
    },
  },
});
