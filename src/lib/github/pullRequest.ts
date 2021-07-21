import { GqlPullRequest } from "../../generated/operations";
import { PullRequestQuery } from "../../generated/graphql"
import { print } from "graphql";
import { repoFromUrl } from "./repoFromUrl";

/**
 * @typedef GetPrOptions
 * @prop {boolean=} includeStatus
 * @prop {boolean=} includeReviews
 */

/**
 * @param {import('./api').GithubApi} api
 * @param {string} owner
 * @param {string} name
 * @param {number} number
 * @param {GetPrOptions=} options
 * @returns {Promise<any>}
 */
export async function getPr(api, owner, name, number, options = {}): Promise<PullRequestQuery['repository']['pullRequest']> {
  const result = await api(print(GqlPullRequest), { owner, name, number, ...options });
  return result.repository.pullRequest;
}

/**
 * @param {string} url
 */
const prNumberFromUrl = (url) => Number(new URL(url).pathname.split("/")[4]);

/**
 * @param {import('./api').GithubApi} api
 * @param {string} url
 * @param {GetPrOptions=} options
 */
export async function getPrByUrl(api, url, options = {}) {
  const [owner, name] = repoFromUrl(url);
  const number = prNumberFromUrl(url);

  return getPr(api, owner, name, number, options);
}
