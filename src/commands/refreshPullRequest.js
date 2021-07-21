import { withGitHubApi } from "../lib/github/api";
import { getPrByUrl } from "../lib/github/getPr";
import { processPullRequest } from "../store/processPullRequest"

/**
 * @param {string} urlString
 */
function validPrUrl(urlString) {
  const url = new URL(urlString);
  return (
    url.origin === "https://github.com" &&
    url.pathname.match(/\/[^\/]+\/[^\/]+\/pull\/\d+/)
  );
}

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
