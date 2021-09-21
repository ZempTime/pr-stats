import { PullRequestQuery, } from "../generated/graphql";
import { IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS } from "../extension";
import { computeUpdatedPr } from "./pullRequest";
import bucketedStorage from "./bucketedStorage";

export const processPullRequest = async (
  { pullRequest }: { record: any, pullRequest: PullRequestQuery['repository']['pullRequest'] }
) => {
  console.group(`processPullRequest() ${pullRequest.url}`)
  const updatedPr = computeUpdatedPr(pullRequest);

  console.info(`Updating ${IDENTIFIER} ${FIELD_ACCOUNT_PULL_REQUESTS} with:`);
  console.info(JSON.stringify(updatedPr, null, 2));

  await bucketedStorage.storePullRequests([updatedPr]);

  console.groupEnd();
}
