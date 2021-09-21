import React from "react";
import prettyMs from 'https://cdn.skypack.dev/pretty-ms';

export const Metadata = ({ metadata }) => {
  const { lastRunAt, cutoffDate, repos, pullRequestCount } = metadata;

  return (
    <>
      <aha-panel heading="Metadata">
        {/* <p>Last run: {prettyMs(Date.now() - Date.parse(lastRunAt))} ago </p> */}
        <p>Cutoff date: {cutoffDate} </p>
        <p>Repos: [{repos.map(repo => `'${repo}'`).join(", ")}] </p>
        <p># PRs updated: {pullRequestCount} </p>
      </aha-panel>
    </>
  );
};
