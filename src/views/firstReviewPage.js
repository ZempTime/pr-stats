import React, { useState, useEffect } from "react";
import prettyMs from 'https://cdn.skypack.dev/pretty-ms';

const PROMISE_STATES = {
  notasked: 'notasked',
  pending: 'pending',
  success: 'success',
  error: 'error'
};

const RECORD_TYPES = ['FEATURE', 'REQUIREMENT'];

const initialQueryState = {
  status: PROMISE_STATES.notasked,
  error: null,
  data: null
};

const Styles = () => {
  return (
    <style>
      {`
  .title {
    color: var(--aha-blue-800);
    font-size: 20px;
    text-align: center;
    margin: 20px;
  }
    
  .firstReviewContainer {
    display: flex;
    flex-direction: column;
    margin-left: ;
    max-width: 800px;
    margin: 20px auto;
  }
    `}
    </style>
  );
};

const query = (recordType) => {
  return `
    query {
      extensionFields(filters: {extensionFieldableType: ${recordType}, extensionIdentifier: "zemptime.pr-stats", name: "firstReviews"}) {
        nodes {
          name
          value
          extensionFieldableType
          extensionFieldableId
          extensionFieldable {
            ... on Requirement {
              id
              name
            }
            ... on Feature {
              id
              name
            }
          }
        }
      }
    }
  `
};

const FirstReviewPage = ({ teams }) => {
  const [featuresQuery, setFeaturesQuery] = useState(initialQueryState);
  const [requirementsQuery, setRequirementsQuery] = useState(initialQueryState);

  const initialTeamValue = new URLSearchParams(window.location.search).get("team") || teams[0] || '';
  const [selectedTeam, setSelectedTeam] = useState(initialTeamValue);

  useEffect(() => {
    async function fetchFirstReviews({ getRef, setRef, recordType }) {
      try {
        setRef({ ...getRef, status: PROMISE_STATES.pending });
        const data = await aha.graphQuery(
          query(recordType)
        );
        setRef({ ...getRef, status: PROMISE_STATES.success, data });
      } catch (e) {
        setRef({ ...getRef, status: PROMISE_STATES.error, error: e })
      }
    };
    fetchFirstReviews({ getRef: featuresQuery, setRef: setFeaturesQuery, recordType: "FEATURE" });
    fetchFirstReviews({ getRef: requirementsQuery, setRef: setRequirementsQuery, recordType: "REQUIREMENT" });
  }, [])

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  }

  const queryStatuses = [featuresQuery.status, requirementsQuery.status];

  let stats = '';

  if (queryStatuses.includes(PROMISE_STATES.error)) {
    stats = (
      <>
        <p>There was an error. Please contact support@aha.io</p>
        <p>Nah I'm jk ping @czempel</p>
      </>
    )
  }

  if (queryStatuses.includes(PROMISE_STATES.pending)) {
    stats = (
      <>
        <p>
          <aha-spinner size="5em"></aha-spinner>
        </p>
      </>
    )
  }

  if (queryStatuses.every(status => status === PROMISE_STATES.success)) {
    featuresQuery.data.extensionFields;

    const prs = [
      ...featuresQuery.data.extensionFields.nodes.map(node => node.value).flat(),
      ...requirementsQuery.data.extensionFields.nodes.map(node => node.value).flat()
    ];

    const reviewedPrs = prs
      .filter(entry => entry.team.toLowerCase() === selectedTeam.toLowerCase())
      .filter(entry => entry?.time_to_first_review)

    const teamAverageMs = reviewedPrs.reduce((acc, pr) => acc + pr.time_to_first_review, 0) / reviewedPrs.length;

    const average = prettyMs(teamAverageMs)


    stats = (
      <>
        <h3>Current average time to first review: {average} </h3>

        {
          reviewedPrs
            .sort(pr => pr.review_requested_at)
            .map(pr => (
              <div>
                <a href={pr.url} target="_blank" rel="noopener noreferrer">
                  {pr.url} - {prettyMs(pr.time_to_first_review)}
                </a>
              </div>
            ))
        }
      </>
    )
  }

  return (
    <>
      <Styles />
      <div className='title'>Time to First Review</div>

      <div className="firstReviewContainer">
        <select name="team" onChange={handleTeamChange} value={selectedTeam}>
          {teams.map((team) => <option value={team}>{team}</option>)}
        </select>

        {stats}
      </div>
    </>
  );
}

aha.on("firstReviewPage", ({ record, fields }, { identifier, settings }) => {
  const teams = settings.get("firstReviews").map((s) => s.split(",")[0]);

  return (
    <FirstReviewPage teams={teams} />
  );
});
