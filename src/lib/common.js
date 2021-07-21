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
