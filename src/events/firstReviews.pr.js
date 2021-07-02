const extensionIdentifier = "zemptime.pr-stats";
const fieldName = "firstReviews";

// Sample value for `firstReviews` extension field:
// {
//   "conversion": {
//     18511: {
//       url: "https://github.com/aha-app/aha-app/pull/18511",
//       timestamps: {
//         review_requested: "2021-05-02 12:45:53",
//         reviewed: "2021-05-02 12:55:22"
//       }
//     }
//   }
// }

const buildTeamFilters = (firstReviewSettings) => {
  return firstReviewSettings.map((val) => {
    const [team, regex] = val.split(",")
    const filter = new RegExp(regex, 'i');
    return [team.toLowerCase(), filter]
  })
};

const setReviewRequested = (currentFirstReviews, {team, id, url, updated_at}) => {
  const hasReviewRequested = Boolean(currentFirstReviews?.[team]?.[id]?.timestamps?.review_requested);

  // only track first review requested
  if (hasReviewRequested) return currentFirstReviews;
  
  return {
    ...currentFirstReviews,
    [team]: {
      ...currentFirstReviews?.[team],
      [id]: {
        url: url,
        timestamps: {
          review_requested: updated_at
        }
      }
    }
  }
};

const setReviewed = (currentFirstReviews, {team, id, url, updated_at}) => {
  const hasReviewRequested = Boolean(currentFirstReviews?.[team]?.[id]?.timestamps?.review_requested);
  const hasFirstReview = Boolean(currentFirstReviews?.[team]?.[id]?.timestamps?.reviewed);

  // avoid incomplete data where we're tracking a completed review and no known date for review requested
  if (!hasReviewRequested) return removeReviewedPr(currentFirstReviews, {team, id});
  if (hasFirstReview) return currentFirstReviews;
  
  return {
    ...currentFirstReviews,
    [team]: {
      ...currentFirstReviews?.[team],
      [id]: {
        url: url,
        timestamps: {
          ...currentFirstReviews?.[team]?.[id]?.timestamps,
          reviewed: updated_at,
        }
      }
    }
  }
};

const removeReviewedPr = (currentFirstReviews, {team, id}) => {
  const hasPr = Boolean(currentFirstReviews?.[team]?.[id]);

  if (!hasPr) return currentFirstReviews;
  
  return {
    ...currentFirstReviews,
    [team]: {
      ...Object.entries(currentFirstReviews?.[team] || [])
        .filter(([pr_id, _pr_val]) => pr_id !== id)
    }
  }
};

aha.on({ event: 'aha-develop.github.pr.review_requested' }, async({ record, payload }, { identifier, settings }) => {
  const initialFirstReviews = await record.getExtensionField(extensionIdentifier, fieldName);
  const { id, url, updated_at, title } = payload.pull_request;

  const teamFilters = buildTeamFilters(settings.firstReviews);
  
  const updatedFirstReviews = teamFilters.reduce((currentFirstReviews, [team, filter]) => {
    if (filter.test(title)) {
      return setReviewRequested(currentFirstReviews, {team, id, url, updated_at});
    }
    return currentFirstReviews;
  }, initialFirstReviews);
  
  await record.setExtensionField(extensionIdentifier, fieldName, updatedFirstReviews);
});

aha.on({ event: 'aha-develop.github.pr.reviewed' }, async({ record, payload }, { identifier, settings }) => {
  const initialFirstReviews = await record.getExtensionField(extensionIdentifier, fieldName);
  const { id, url, updated_at, title } = payload.pull_request;

  const teamFilters = buildTeamFilters(settings.firstReviews);
  
  const updatedFirstReviews = teamFilters.reduce((currentFirstReviews, [team, filter]) => {
    if (filter.test(title)) {
      return setReviewed(currentFirstReviews, {team, id, url, updated_at});
    }
    return currentFirstReviews;
  }, initialFirstReviews);
  
  await record.setExtensionField(extensionIdentifier, fieldName, updatedFirstReviews);
});

aha.on({ event: 'aha-develop.github.pr.review_request_removed' }, async({ record, payload }, { identifier, settings }) => {
  const initialFirstReviews = await record.getExtensionField(extensionIdentifier, fieldName);
  const { id, title } = payload.pull_request;

  const teamFilters = buildTeamFilters(settings.firstReviews);
  
  const updatedFirstReviews = teamFilters.reduce((currentFirstReviews, [team, filter]) => {
    if (filter.test(title)) {
      return removeReviewedPr(currentFirstReviews, {team, id});
    }
    return currentFirstReviews;
  }, initialFirstReviews);
  
  await record.setExtensionField(extensionIdentifier, fieldName, updatedFirstReviews);
});

aha.on({ event: 'aha-develop.github.pr.review_dismissed' }, async({ record, payload }, { identifier, settings }) => {
  const initialFirstReviews = await record.getExtensionField(extensionIdentifier, fieldName);
  const { id, title } = payload.pull_request;

  const teamFilters = buildTeamFilters(settings.firstReviews);
  
  const updatedFirstReviews = teamFilters.reduce((currentFirstReviews, [team, filter]) => {
    if (filter.test(title)) {
      return removeReviewedPr(currentFirstReviews, {team, id});
    }
    return currentFirstReviews;
  }, initialFirstReviews);
  
  await record.setExtensionField(extensionIdentifier, fieldName, updatedFirstReviews);
});
