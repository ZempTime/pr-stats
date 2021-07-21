import { print } from "graphql";
import { GqlInitialPullRequests, GqlPaginatedPullRequests } from "../../generated/operations";
import { InitialPullRequestsQuery, PaginatedPullRequestsQuery } from "../../generated/graphql"

export async function initialPullRequests(api, owner, name, options = {}): Promise<InitialPullRequestsQuery['repository']['pullRequests']> {
  let result: InitialPullRequestsQuery;
  result = await api(print(GqlInitialPullRequests), { owner, name, ...options });
  return result.repository.pullRequests;
}

export async function paginatedPullRequests(api, owner, name, after, options = {}): Promise<PaginatedPullRequestsQuery['repository']['pullRequests']> {
  let result: PaginatedPullRequestsQuery;
  result = await await api(print(GqlPaginatedPullRequests), { owner, name, after, ...options });
  return result.repository.pullRequests;
}
