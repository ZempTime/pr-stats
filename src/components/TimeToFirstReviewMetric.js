import React, { useState } from "react"
import { buildTeamFilters, prettyMsSanitized, groupByWeek } from "../lib/common";
import { teamLoginsFilter, notSupportFilter, hasFirstReviewDurationFilter, hasFirstReviewRequestedAtFilter } from "./filters";
import { PrActionTable } from "./PrActionTable";

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

const calculateHistoricAverage = (pullRequests) => {
  const prs = pullRequests
    .filter(notSupportFilter)
    .filter(hasFirstReviewDurationFilter);

  const numerator = prs.reduce((acc, pr) => acc + pr.state.context.firstReviewDuration, 0);
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

  const weeklyGroups = groupByWeek(pullRequests);
  const teamWeeklyGroups = groupByWeek(historicAveragePRs);

  return (
    <>
      <aha-panel heading="Time to first review">
        <select name="team" onChange={handleTeamChange} value={selectedTeam}>
          {teamFilters.map((team) => <option value={team[0]}>{team[0]}</option>)}
        </select>
        <p>usernames: {teamLogins.join(", ")}</p>
        <a href="https://github.com/ZempTime/pr-stats/blob/main/src/store/pullRequestMachine.js" target="_blank" rel="noopener noreferrer">How is this calculated?</a>
        <aha-flex gap={'4em'}>
          <div className="panelSection">
            <p><strong>Historic Team Average:</strong></p>
            <h3>{prettyMsSanitized(teamHistoricAverageMs)} </h3>
            <p>across {historicAveragePRs.length} prs</p>
            <p>(Avg of PR's which have had their first review)</p>
          </div>

          <div className="panelSection">
            <p><strong>Inclusive Team Average:</strong></p>
            <h3>{prettyMsSanitized(teamInclusiveAverageMs)} </h3>
            <p>across {inclusiveAveragePRs.length} prs</p>
            <p>(Includes PR's still needing review)</p>
          </div>
        </aha-flex>

        <br />

        <div>
          <h3>Historic for {selectedTeamName} </h3>
          <table>
            <thead>
              <th>Date</th>
              <th>Minutes</th>
              <th># prs</th>
              <th></th>
            </thead>
            <tbody>
              {
                Object.entries(teamWeeklyGroups).map(([week, prs]) => {
                  const [historicAverageMS, numPrs] = calculateHistoricAverage(prs);
                  return (
                    <tr>
                      <td>{week.slice(0, 15)}</td>
                      <td>{ Math.round(historicAverageMS / (1000 * 60)) }</td>
                      <td>{numPrs.length}</td>
                      <td>
                        <aha-help-popover open-width="600px">
                          <PrActionTable prs={prs} />
                        </aha-help-popover>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>

        <br />

        <div>
          <h3>Historic All Teams</h3>
          <table>
            <thead>
              <th>Date</th>
              <th>Minutes</th>
              <th># prs</th>
              <th></th>
            </thead>
            <tbody>
              {
                Object.entries(weeklyGroups).map(([week, prs]) => {
                  const [historicAverageMS, numPrs] = calculateHistoricAverage(prs);
                  return (
                    <tr>
                      <td>{week.slice(0, 15)}</td>
                      <td>{ Math.round(historicAverageMS / (1000 * 60)) }</td>
                      <td>{numPrs.length}</td>
                      <td>
                        <aha-help-popover open-width="600px">
                          <PrActionTable prs={prs} />
                        </aha-help-popover>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </aha-panel>
    </>
  );
};
