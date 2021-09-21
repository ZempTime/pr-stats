import { IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS_PREFIX } from "../extension";

const storePullRequests = async (pullRequests) => {
  if (!pullRequests) return;
  if (pullRequests.length === 0) return;

  const prsByKey = pullRequestsByKey(pullRequests);
  
  Object.keys(prsByKey).forEach(async (key) => {
    await upsertPrs(key, prsByKey[key]);
  });
}

const pullRequestsByKey = (pullRequests) => {
  const pullRequestsByKey = {}

  pullRequests.forEach((pr) => {
    const key = bucketKey(pr.createdAt);
    if (!(key in pullRequestsByKey)) pullRequestsByKey[key] = [];
    pullRequestsByKey[key] = [...pullRequestsByKey[key], pr];
  });
  
  return pullRequestsByKey;
}

const upsertPrs = async (bucketKey, updatedPrs) => {
  const lookupPath = `${FIELD_ACCOUNT_PULL_REQUESTS_PREFIX}${bucketKey}`;
  const existingPrs = await aha.account.getExtensionField(IDENTIFIER, lookupPath);
  
  const updatedPrIds = updatedPrs.map(pr => pr.id);
  
  const upsertedPrs = [
    ...(existingPrs || []).filter(pr => !updatedPrIds.includes(pr.id)),
    ...updatedPrs
  ];

  await aha.account.setExtensionField(IDENTIFIER, lookupPath, upsertedPrs);
}

// We convert date strings to #'s so we can just do number comparisons and sidestep
// date/string parsing logic when determining bucket reading/writing.
const MILLISECONDS_IN_DAY = 86400000;

// Returns the closest start of day in ms
// bucketKey("2021-09-10T13:09:38Z") === bucketKey("2021-09-10")
export const bucketKey = (dateStr) => {
  const dateNum = Date.parse(dateStr);
  return dateNum - (dateNum % MILLISECONDS_IN_DAY);
}

// {
//   "id": "MDExOlB1bGxSZXF1ZXN0NzMxNDQxMjcx",
//   "createdAt": "2021-09-10T13:09:38Z",
//   "title": "CN-1082⚡️Specify the primary recipient when sending emails from Admin",
//   "url": "https://github.com/aha-app/aha-app/pull/19417",
//   "login": "ZempTime",
//   "state": {
//     "value": "reviewed",
//     "context": {
//       "firstReviewRequestedAt": "2021-09-17T17:47:05Z",
//       "firstReviewSubmittedAt": "2021-09-17T20:03:27Z",
//       "firstReviewDuration": 8182000,
//       "readyLabeledAt": null,
//       "mergedAt": null,
//       "readyToMergedDuration": null,
//       "labels": [
//         "Needs code review"
//       ],
//       "requestedReviewers": [
//         "MDQ6VXNlcjEzODA0OA==",
//         "MDQ6VXNlcjE2OTA3Ng=="
//       ]
//     }
//   }
// }

export default {
  storePullRequests
}
