import prettyMs from 'https://cdn.skypack.dev/pretty-ms';
import moment from 'https://cdn.skypack.dev/moment';
import _ from 'https://cdn.skypack.dev/lodash-es';

/*
  [
    'TeamName1,zemptime,othername',
    'TeamName2,login1,login2'
  ]
  ->
  [
    ['TeamName1', ['zemptime', 'othername']],
    ['TeamName2', ['login1', 'login2']]
  ]
*/
export const buildTeamFilters = (firstReviewSettings) => {
  return firstReviewSettings.map((val) => {
    const [team, ...usernames] = val.split(",")
    return [team.toLowerCase(), usernames.map(u => u.toLowerCase())];
  })
};

export const validPrUrl = (urlString) => {
  const url = new URL(urlString);
  return (
    url.origin === "https://github.com" &&
    url.pathname.match(/\/[^\/]+\/[^\/]+\/pull\/\d+/)
  );
}

export const prettyMsSanitized = (potentialMs) => {
  if (!potentialMs) return 0;
  return prettyMs(Math.round(potentialMs));
}

export const groupByWeek = (pullRequests) => _.groupBy(
  pullRequests,
  (pullRequest) => moment(pullRequest.state.context.mergedAt).startOf('isoWeek')
);
