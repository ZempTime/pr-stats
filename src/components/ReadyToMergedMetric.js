import React from "react"
import { prettyMsSanitized } from "../lib/common";
import { notSupportFilter, hasReadyToMergedDurationFilter, isSupportFilter } from "./filters";

const calculateNonSupportAverage = ({ pullRequests }) => {
  const prs = pullRequests
    .filter(notSupportFilter)
    .filter(hasReadyToMergedDurationFilter);

  const numerator = prs.reduce((acc, pr) => acc + pr.state.context.readyToMergedDuration, 0);
  const denominator = prs.length;

  if (denominator === 0) return [0, prs];

  return [numerator / denominator, prs];
};

const calculateSupportAverage = ({ pullRequests }) => {
  const prs = pullRequests
    .filter(isSupportFilter)
    .filter(hasReadyToMergedDurationFilter);

  const numerator = prs.reduce((acc, pr) => acc + pr.state.context.readyToMergedDuration, 0);
  const denominator = prs.length;

  if (denominator === 0) return [0, prs];

  return [numerator / denominator, prs];
};

export const ReadyToMergedMetric = ({ pullRequests }) => {

  const [nonSupportAverageMs, nonSupportPrs] = calculateNonSupportAverage({ pullRequests });
  const [supportAverageMs, supportPrs] = calculateSupportAverage({ pullRequests });

  return (
    <>
      <aha-panel heading="Labeled Ready to Merged">
        <aha-flex gap={'4em'}>
          <div className="panelSection">
            <p><strong>Non-support:</strong></p>
            <h3>{prettyMsSanitized(nonSupportAverageMs)}</h3>
            <p>across {nonSupportPrs.length} prs</p>
          </div>

          <div className="panelSection">
            <p><strong>Support:</strong></p>
            <h3>{prettyMsSanitized(supportAverageMs)}</h3>
            <p>across {supportPrs.length} prs</p>
          </div>
        </aha-flex>
      </aha-panel>
    </>
  );
};
