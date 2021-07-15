import React, { useState, useEffect } from "react";
import prettyMs from 'https://cdn.skypack.dev/pretty-ms';

const PROMISE_STATES = {
  notasked: 'notasked',
  pending: 'pending',
  success: 'success',
  error: 'error'
};

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
    color: var(--aha-blue-400);
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
  
  .clickable {
    color: var(--aha-blue-400)
    cursor: pointer;
  }
  
  .clickable:hover {
    color: var(--aha-orange-500)
  }
  
  .active {
    text-decoration: underline
  }
  
  table {
    border-collapse: collapse;
    margin-bottom: 10px;
    width: 100%;
    table-layout: fixed;
  }
  
  table caption {
    text-align: left;
  }
  
  td,
  th {
    padding: 6px;
    text-align: left;
    vertical-align: top;
    word-wrap: break-word;
  }
  
  thead {
    border-bottom: 1px solid #dbdbdb;
    border-bottom: 1px solid var(--aha-gray-100);
  }
  
  tfoot {
    border-top: 1px solid #dbdbdb;
    border-top: 1px solid var(--aha-gray-100);
  }
  
  tbody tr:nth-child(even) {
    background-color: #f7f7f7;
    background-color: var(--aha-teal-100);
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

  const [sortColumn, setSortColumn] = useState("date");

  const sortFn = (column) => {
    return {
      "date": dateCompare,
      "duration": durationCompare
    }[column];
  };

  const dateCompare = (a, b) => Date.parse(b.review_requested_at) - Date.parse(a.review_requested_at);
  const durationCompare = (a, b) => b.time_to_first_review - a.time_to_first_review;

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

        <table>
          <thead>
            <tr>
              <th>Name (but actually id)</th>
              <th
                className={`clickable ${sortColumn === "date" ? 'active' : 'inactive'}`}
                onClick={() => setSortColumn("date")}
              >
                Date
              </th>
              <th>Link</th>
              <th
                className={`clickable ${sortColumn === "duration" ? 'active' : 'inactive'}`}
                onClick={() => setSortColumn("duration")}
              >
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {
              reviewedPrs
                .sort(sortFn(sortColumn))
                .map(pr => (
                  <tr>
                    <td>
                      {pr.id}
                    </td>
                    <td>
                      {pr.review_requested_at.slice(0, 10)}
                    </td>
                    <td>
                      <a href={pr.url} target="_blank" rel="noopener noreferrer">
                        {pr.url}
                      </a>
                    </td>
                    <td>
                      {prettyMs(pr.time_to_first_review)}
                    </td>
                  </tr>
                ))
            }

          </tbody>
        </table>
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

        <br />
        <blockquote>
          Magic mirror on the wall...
          what toppings are best of all?
        </blockquote>
        <img src="https://www.qsrmagazine.com/sites/default/files/phut_0.jpg"></img>
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
