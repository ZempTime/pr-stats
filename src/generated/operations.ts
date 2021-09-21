import gql from 'graphql-tag';
 /* This file is generated from the contents of src/lib/github/queries.graphql */ /* Do not modify this file directly */ /* Use `yarn codegen` to update this file */ 
export const TimelineItemsData = gql`
    fragment TimelineItemsData on PullRequest {
  timelineItems(
    first: 50
    itemTypes: [REVIEW_REQUESTED_EVENT, REVIEW_REQUEST_REMOVED_EVENT, PULL_REQUEST_REVIEW, CLOSED_EVENT, CONVERT_TO_DRAFT_EVENT, REMOVED_FROM_PROJECT_EVENT, LABELED_EVENT, MERGED_EVENT, UNLABELED_EVENT]
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    nodes {
      __typename
      ... on ReviewRequestedEvent {
        createdAt
        requestedReviewer {
          __typename
          ... on Team {
            id
          }
          ... on User {
            id
          }
        }
      }
      ... on ReviewRequestRemovedEvent {
        createdAt
        requestedReviewer {
          __typename
          ... on Team {
            id
          }
          ... on User {
            id
          }
        }
      }
      ... on PullRequestReview {
        createdAt
        author {
          login
        }
      }
      ... on ClosedEvent {
        createdAt
      }
      ... on ReopenedEvent {
        createdAt
      }
      ... on RemovedFromProjectEvent {
        createdAt
      }
      ... on LabeledEvent {
        id
        createdAt
        label {
          name
        }
      }
      ... on UnlabeledEvent {
        id
        label {
          name
        }
      }
      ... on MergedEvent {
        createdAt
        resourcePath
      }
    }
  }
}
    `;
export const PullRequestData = gql`
    fragment PullRequestData on PullRequest {
  id
  createdAt
  title
  url
  author {
    login
  }
}
    `;
export const GqlPullRequest = gql`
    query PullRequest($name: String!, $owner: String!, $number: Int!) {
  repository(name: $name, owner: $owner) {
    pullRequest(number: $number) {
      ...PullRequestData
      ...TimelineItemsData
    }
  }
}
    ${PullRequestData}
${TimelineItemsData}`;
export const GqlInitialPullRequests = gql`
    query InitialPullRequests($name: String!, $owner: String!) {
  repository(name: $name, owner: $owner) {
    pullRequests(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        ...PullRequestData
        ...TimelineItemsData
      }
    }
  }
}
    ${PullRequestData}
${TimelineItemsData}`;
export const GqlPaginatedPullRequests = gql`
    query PaginatedPullRequests($name: String!, $owner: String!, $after: String!) {
  repository(name: $name, owner: $owner) {
    pullRequests(
      first: 20
      after: $after
      orderBy: {field: CREATED_AT, direction: DESC}
    ) {
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        ...PullRequestData
        ...TimelineItemsData
      }
    }
  }
}
    ${PullRequestData}
${TimelineItemsData}`;