import { SETTING_ACCOUNT_CUTOFF_DATE, SETTING_ACCOUNT_REPOS } from "../extension";
import { processPullRequests } from "../store/processPullRequests";

// TODO: Unclear how I should organize what handles promises, what handles data updates, etc.
// Leaving messy for now until it's working.

aha.on("updatePullRequests", async ({ record }, { identifier, settings }) => {
  const repos = settings.get(SETTING_ACCOUNT_REPOS);
  const cutoffDate = settings.get(SETTING_ACCOUNT_CUTOFF_DATE);

  console.info(`updatePullRequests: starting processing for repos ${repos} until ${cutoffDate}`);
  await processPullRequests({ record: aha.account, repos, cutoffDate })
  console.info(`updatePullRequests: finished processing for repos ${repos} until ${cutoffDate}`);
});
