import { PullRequestQuery, } from "../generated/graphql";
import { IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS } from "../extension";
import { computeUpdatedPr } from "./pullRequest";

export const processPullRequest = async (
  { record, pullRequest }: { record: any, pullRequest: PullRequestQuery['repository']['pullRequest'] }
) => {
  console.group(`processPullRequest() ${pullRequest.url}`)
  const updatedPr = computeUpdatedPr(pullRequest);

  const existingPrs = await record.getExtensionField(IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS);

  const pullRequests = [
    ...(existingPrs || []).filter(pr => pr.id !== updatedPr.id),
    updatedPr
  ]

  console.info(`Updating ${IDENTIFIER} ${FIELD_ACCOUNT_PULL_REQUESTS} with:`);
  console.info(JSON.stringify(updatedPr, null, 2));

  await record.setExtensionField(IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS, pullRequests);

  console.groupEnd();
}
