const extensionIdentifier = "zemptime.pr-stats";
const fieldName = "firstReviews";

//     pull_requests: [
//       {
//         team: "",
//         id:,
//         url:,
//         review_requested_at: ,
//         time_to_first_review: ,
//         pull_request_reviews: [
//           {
//             id:,
//             action:,
//             created_at, 
//           }
//         ]
//       }
//     ]


// 2021-07-07 17:38:09  -> review requested

class FirstReviewTracker {
  constructor(state) {
    this._state = state || [];
  }

  set state(val) {
    this._state = val;
  }

  get state() {
    return this._state;
  }

  // 2021-07-07 17:35:11
  reviewRequested({ team, id, url, updated_at }) {
    let pr = this.state.find((pullRequest) => pullRequest.id === id);

    if (!pr) {
      console.log(`Tracking new PR with id ${id}`);

      pr = {
        id,
        team,
        url,
        pull_request_reviews: [],
        review_requested_at: updated_at,
      };

      this.state.push(pr);
    }

    const hasReviewsSubmitted = pr.pull_request_reviews.length > 0;

    if (!hasReviewsSubmitted) {
      pr.url = url;
      pr.team = team;
      pr.review_requested_at = updated_at;
    }
  }

  //  2021-07-08 16:41:28
  reviewSubmitted({ team, id, review_id, review_submitted_at }) {
    const pr = this.state.find((pullRequest) => pullRequest.id === id);

    const hasReviewRequestedAt = Boolean(pr.review_requested_at);
    if (!hasReviewRequestedAt) this.removePullRequest({ team, id })

    const review = pr.pull_request_reviews.find((prr) => prr.id === review_id);

    if (!review) {
      console.log(`Tracking new PR pull_request_review with review_id ${review_id}`);
      pr.pull_request_reviews.push({
        id: review_id,
        action: 'submitted',
        created_at: review_submitted_at,
      });
    }

    this.computeTimeToFirstReview(id);
  }

  removePullRequest({ team, id }) {
    this.state = this.state.filter((pr) => pr.id === id && pr.team === team);
  }

  computeTimeToFirstReview(id) {
    console.log(`Computing time to first review for PR ${id}`);
    const pr = this.state.find((pull_request) => pull_request.id === id);
    if (!pr || pr.review_requested_at === null) return;

    const review = pr.pull_request_reviews
      .filter(r => r.action === 'submitted')
      .sort(r => Date.parse(r.created_at))
      ?.[0];

    const time_to_first_review = Date.parse(review.created_at) - Date.parse(pr.review_requested_at);

    console.log(`Setting time to first review to ${time_to_first_review} for pr ${id}`)
    pr.time_to_first_review = time_to_first_review;
  }
}

const buildTeamFilters = (firstReviewSettings) => {
  return firstReviewSettings.map((val) => {
    const [team, regex] = val.split(",")
    const filter = new RegExp(regex, 'i');
    return [team.toLowerCase(), filter]
  })
};

aha.on({ event: 'aha-develop.github.pr.review_requested' }, async ({ record, payload }, { identifier, settings }) => {
  const initialFirstReviews = await record.getExtensionField(extensionIdentifier, fieldName);
  const { id, html_url, updated_at, title } = payload.pull_request;

  const teamFilters = buildTeamFilters(settings.firstReviews);
  const tracker = new FirstReviewTracker(initialFirstReviews);

  let hasUpdate = false;

  teamFilters.forEach(([team, filter]) => {
    if (filter.test(title)) {
      console.log(`Review Requested: PR with id ${id} and title '${title}' qualified for team '${team}'`)
      hasUpdate = true;

      tracker.reviewRequested({
        team,
        id,
        updated_at,
        url: html_url
      });
    };
  });

  if (hasUpdate) {
    console.log(`Updating ${extensionIdentifier}.${fieldName} with`);
    console.log(JSON.stringify(tracker.state, null, 2));
    await record.setExtensionField(extensionIdentifier, fieldName, tracker.state);
  }
});

aha.on({ event: 'aha-develop.github.pr.review_request_removed' }, async ({ record, payload }, { identifier, settings }) => {
  const initialFirstReviews = await record.getExtensionField(extensionIdentifier, fieldName);
  const { id, title } = payload.pull_request;

  const teamFilters = buildTeamFilters(settings.firstReviews);
  const tracker = new FirstReviewTracker(initialFirstReviews);

  let hasUpdate = false;

  teamFilters.forEach(([team, filter]) => {
    if (filter.test(title)) {
      console.log(`Review Request removed: PR with id ${id} and title '${title}' qualified for team '${team}'`)
      hasUpdate = true;

      tracker.removePullRequest({ team, id });
    }
  });

  if (hasUpdate) {
    console.log(`Updating ${extensionIdentifier}.${fieldName} with`);
    console.log(JSON.stringify(tracker.state, null, 2));
    await record.setExtensionField(extensionIdentifier, fieldName, tracker.state);
  }
});

aha.on({ event: 'aha-develop.github.pull_request_review.submitted' }, async ({ record, payload }, { identifier, settings }) => {
  const initialFirstReviews = await record.getExtensionField(extensionIdentifier, fieldName);
  const { id, title } = payload.pull_request;
  const review_id = payload.review.id;
  const review_submitted_at = payload.review.submitted_at;

  const teamFilters = buildTeamFilters(settings.firstReviews);
  const tracker = new FirstReviewTracker(initialFirstReviews);

  let hasUpdate = false;

  teamFilters.forEach(([team, filter]) => {
    if (filter.test(title)) {
      console.log(`Pull Review Request Submitted: PR with id ${id} and title '${title}' qualified for team '${team}'`)
      hasUpdate = true;

      tracker.reviewSubmitted({ team, id, review_id, review_submitted_at });
    }
  });

  if (hasUpdate) {
    console.log(`Updating ${extensionIdentifier}.${fieldName} with`);
    console.log(JSON.stringify(tracker.state, null, 2));
    await record.setExtensionField(extensionIdentifier, fieldName, tracker.state);
  }
});
