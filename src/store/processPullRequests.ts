import { InitialPullRequestsQuery, PaginatedPullRequestsQuery } from "../generated/graphql";
import { IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS, FIELD_ACCOUNT_PULL_REQUESTS_METADATA } from "../extension";
import { initialPullRequests, paginatedPullRequests } from "../lib/github/pullRequests";
import { withGitHubApi } from "../lib/github/api";
import { computeUpdatedPr } from "./pullRequest";

const hasReachedCutoffDate = (nodes, cutoffDate) => {
  let date;

  try {
    date = Date.parse(cutoffDate);
  } catch (e) {
    console.error(e);
    // If no valid cutoff date provided, stop running.
    return true;
  }

  return nodes.some(node => Date.parse(node.createdAt) < date);
}

const logNodes = (nodes) => console.info(nodes.map(node => node.url));

export const processPullRequests = async ({ record, repos, cutoffDate }) => {
  console.group('processPullRequests');

  const errors = [];
  const updates = {};

  await withGitHubApi(async (api) => {
    await Promise.all(repos.map(async (repo) => {
      const [owner, name] = repo.split("/");

      const initialPrs = await initialPullRequests(api, owner, name);
      const updatedInitialPrs = initialPrs.nodes.map(pr => computeUpdatedPr(pr));
      updatedInitialPrs.forEach(pr => updates[pr.id] = pr);

      if (!initialPrs.pageInfo.hasNextPage) {
        console.info(`Reached end of pages for ${repo}. Stopping.`);
        return;
      }
      if (hasReachedCutoffDate(initialPrs.nodes, cutoffDate)) {
        console.info(`Reached cutoff date ${cutoffDate} for ${repo}. Stopping.`);
        return;
      }

      let continueSearching: boolean = true;
      let cursor: string = initialPrs.pageInfo.endCursor;

      while (continueSearching) {
        console.info(`Retrieving prs for ${repo} after ${cursor}`);
        const {
          nodes,
          pageInfo: {
            hasNextPage,
            endCursor
          },
        } = await paginatedPullRequests(api, owner, name, cursor);

        const updatedPrs = nodes.map(pr => computeUpdatedPr(pr));
        updatedPrs.forEach(pr => updates[pr.id] = pr);

        if (!hasNextPage) {
          console.info(`Reached end of pages for ${repo}. Stopping.`);
          continueSearching = false;
        }

        if (hasReachedCutoffDate(nodes, cutoffDate)) {
          console.info(`Reached cutoff date ${cutoffDate} for ${repo}. Stopping.`);
          continueSearching = false;
        }

        cursor = endCursor;
      }
    }));
  });

  const existingPrs = await record.getExtensionField(IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS);

  const updatedIds = Object.keys(updates);

  const updatedPrs = [
    ...existingPrs.filter(pr => !updatedIds.includes(pr.id)),
    ...Object.values(updates)
  ];

  await record.setExtensionField(IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS, updatedPrs);

  console.info(`Finished processing ${updatedIds.length} pull requests across ${repos.length} repos.`);

  console.groupEnd();
};