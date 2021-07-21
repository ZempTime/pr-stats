import { useAuth } from "@aha-app/aha-develop-react";
// @ts-ignore
import { graphql } from "https://cdn.skypack.dev/@octokit/graphql";
import { GithubApi } from "./github/api";

interface UseGithubOptions<R> {
  /**
   * Initial data
   */
  data?: R;
}

interface GithubApiCallback<R> {
  (api: GithubApi): Promise<R>;
}

export function useGithubApi<R>(
  callback: GithubApiCallback<R>,
  options: UseGithubOptions<R> = {},
  deps: any[] = []
) {
  const authCallback = async (authData: any) => {
    const api = graphql.defaults({
      headers: {
        authorization: `token ${authData.token}`,
      },
    });
    return await callback(api);
  };

  return useAuth(authCallback, options, deps as any);
}
