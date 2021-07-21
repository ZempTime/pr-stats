import { withGitHubApi } from "../lib/github/api";
import { getPrByUrl } from "../lib/github/pullRequest";
import { processPullRequest } from "../store/processPullRequest";
import { validPrUrl } from "../lib/common";

aha.on("refreshPullRequest", async ({ record }, { identifier, settings }) => {
  const prUrl = await aha.commandPrompt("Link URL", {
    placeholder: "Enter the URL to a pull request",
  });

  if (!validPrUrl(prUrl)) {
    throw new Error("Please enter a valid pull request URL");
  }

  await withGitHubApi(async (api) => {
    const pullRequest = await getPrByUrl(api, prUrl);
    await processPullRequest({ record: aha.account, pullRequest: pullRequest })
  });
});
