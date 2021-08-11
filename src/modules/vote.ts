function newVoteSubscribe(parent, args, context, info) {
  return context.pubsub.asyncIterator('NEW_VOTE');
}

import { gql } from '@graphql-ez/plugin-schema';
import { registerResolvers, registerTypeDefs } from '../app';

registerTypeDefs(gql`
  type Vote {
    id: ID!
    link: Link!
    user: User!
  }

  extend type Subscription {
    newVote: Vote
  }

  extend type Link {
    votes: [Vote!]!
  }

  extend type Mutation {
    vote(linkId: ID!): Vote
  }
`);

registerResolvers({
  Mutation: {
    async vote(parent, args, context, info) {
      const { userId } = context;

      if (!userId) throw Error('User could not be found!');

      const vote = await context.prisma.vote.findUnique({
        where: {
          linkId_userId: {
            linkId: Number(args.linkId),
            userId: userId,
          },
        },
      });

      if (Boolean(vote)) {
        throw new Error(`Already voted for link: ${args.linkId}`);
      }

      const newVote = context.prisma.vote.create({
        data: {
          user: { connect: { id: userId } },
          link: { connect: { id: Number(args.linkId) } },
        },
      });
      context.pubsub.publish('NEW_VOTE', newVote);

      return newVote;
    },
  },
  Subscription: {
    newVote: {
      subscribe: newVoteSubscribe,
      resolve: (payload) => {
        return payload;
      },
    },
  },
  Vote: {
    async link(parent, args, context) {
      return context.prisma.vote
        .findUnique({ where: { id: parent.id } })
        .link();
    },
    async user(parent, args, context) {
      return context.prisma.vote
        .findUnique({ where: { id: parent.id } })
        .user();
    },
  },
});
