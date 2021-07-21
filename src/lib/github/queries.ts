import gql from 'graphql-tag';
 /* This file is generated from the contents of src/lib/github/queries.graphql */ /* Do not modify this file directly */ /* Use `yarn codegen` to update this file */ 
export const TimelineItems = gql`
    fragment TimelineItems on PullRequest {
  timelineItems(
    first: 250
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
export const GqlGetPr = gql`
    query GetPr($name: String!, $owner: String!, $number: Int!) {
  repository(name: $name, owner: $owner) {
    pullRequest(number: $number) {
      id
      title
      url
      author {
        login
      }
      ...TimelineItems
    }
  }
}
    ${TimelineItems}`;