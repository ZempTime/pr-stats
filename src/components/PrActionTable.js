import React from "react";
import { withGitHubApi } from "../lib/github/api";
import { getPrByUrl } from "../lib/github/pullRequest";
import { processPullRequest } from "../store/processPullRequest";

export const PrActionTable = ({ prs }) => {
  const refreshPr = (url) => {
    withGitHubApi(async (api) => {
      const pullRequest = await getPrByUrl(api, url);
      await processPullRequest({ record: aha.account, pullRequest: pullRequest })
    });
  }

  return (
    <>
    <thead>
      <th>Minutes</th>
      <th>Refresh</th>
      <th>Link</th>
    </thead>
    <tbody>
      {prs.map(pr =>
        <tr>
          <td>{ Math.round(pr.state.context.firstReviewDuration / (1000 * 60)) }</td>
          <td><a href="#" onClick={() => refreshPr(pr.url)}>refresh</a></td>
          <td><a href={pr.url} target="_blank" rel="noreferrer noopener">{pr.title}</a></td>
        </tr>
      )}
    </tbody>
      <ul>
      </ul>
    </>
  );
};
