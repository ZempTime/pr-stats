// @ts-ignore
import { graphql } from "https://cdn.skypack.dev/@octokit/graphql";
import { GITHUB_AUTH_SCOPE } from "../../extension";

/** @typedef {(query:string,options?:{})=>Promise<any>} GithubApi */

/**
 * @returns {Promise<GithubApi>}
 */
export async function githubApi(cachedOnly = false) {
  const options = { useCachedRetry: true, parameters: { scope: GITHUB_AUTH_SCOPE } };
  if (cachedOnly) {
    options["reAuth"] = false;
  }

  const authData = await aha.auth("github", options);

  return graphql.defaults({
    headers: {
      authorization: `token ${authData.token}`,
    },
  });
}

/**
 *
 * @param {((api: GithubApi) => Promise<any>)} callback
 * @returns
 */
export async function withGitHubApi(callback) {
  const api = await githubApi(false);
  return await callback(api);
}
