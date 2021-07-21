import React, { useState } from "react"
import prettyMs from 'https://cdn.skypack.dev/pretty-ms';
import { buildTeamFilters } from "../lib/common";
import { teamLoginsFilter, notSupportFilter, hasFirstReviewDurationFilter, hasFirstReviewRequestedAtFilter } from "./filters";

// For PR's which have had their first review, how long did it take?
const calculateHistoricTeamAverage = ({ pullRequests, teamLogins }) => {
  const prs = pullRequests
    .filter(teamLoginsFilter(teamLogins))
    .filter(notSupportFilter)
    .filter(hasFirstReviewDurationFilter);

  const numerator = prs.reduce((acc, pr) => acc + pr.state.context.firstReviewDuration, 0);
  const denominator = prs.length;

  if (denominator === 0) return [0, prs];

  return [numerator / denominator, prs];
};

// For PR's which have had their first review, and those which have requested
// one/haven't received a review yet as though they were reviewed now.
const calculateInclusiveTeamAverage = ({ pullRequests, teamLogins }) => {
  const prs = pullRequests
    .filter(teamLoginsFilter(teamLogins))
    .filter(notSupportFilter)
    .filter(hasFirstReviewRequestedAtFilter);

  const numerator = prs.reduce((acc, pr) => {
    const { firstReviewRequestedAt, firstReviewDuration } = pr.state.context;

    if (!!firstReviewDuration) return acc + firstReviewDuration;

    const elapsed = Date.now() - Date.parse(firstReviewRequestedAt);

    return elapsed + acc;
  }, 0);

  const denominator = prs.length;

  if (denominator === 0) return [0, prs];

  return [numerator / denominator, prs];
};

export const TimeToFirstReviewMetric = ({ pullRequests, teams }) => {

  const teamFilters = buildTeamFilters(teams);

  const initialTeamValue = new URLSearchParams(window.location.search).get("team") || teamFilters?.[0]?.[0] || '';
  const [selectedTeamName, setSelectedTeamName] = useState(initialTeamValue);

  const handleTeamChange = (e) => {
    setSelectedTeamName(e.target.value);
  }

  const [selectedTeam, teamLogins] = teamFilters.find(team => team[0] === selectedTeamName);

  const [teamHistoricAverageMs, historicAveragePRs] = calculateHistoricTeamAverage({ pullRequests, teamLogins });
  const [teamInclusiveAverageMs, inclusiveAveragePRs] = calculateInclusiveTeamAverage({ pullRequests, teamLogins })

  return (
    <>
      <aha-panel heading="Time to first review">
        <select name="team" onChange={handleTeamChange} value={selectedTeam}>
          {teamFilters.map((team) => <option value={team[0]}>{team[0]}</option>)}
        </select>
        <p>usernames: {teamLogins.join(", ")}</p>

        <aha-flex gap={'4em'}>
          <div className="panelSection">
            <p><strong>Historic Team Average:</strong></p>
            <h3>{prettyMs(teamHistoricAverageMs)} </h3>
            <p>across {historicAveragePRs.length} prs</p>
            <p>(Avg of PR's which have had their first review)</p>
          </div>

          <div className="panelSection">
            <p><strong>Inclusive Team Average:</strong></p>
            <h3>{prettyMs(teamInclusiveAverageMs)} </h3>
            <p>across {inclusiveAveragePRs.length} prs</p>
            <p>(Includes PR's still needing review)</p>
          </div>
        </aha-flex>
      </aha-panel>
    </>
  );
};
