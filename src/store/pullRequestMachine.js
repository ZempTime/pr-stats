import { createMachine, assign } from "xstate/es";
import { LABEL_READY } from "../extension";

const labelEvents = {
  LabeledEvent: {
    actions: ['addLabel', 'maybeAddReadyLabeledAt']
  },
  UnlabeledEvent: {
    actions: ["removeLabel", 'maybeRemoveReadyLabeledAt']
  },
};

const pullRequestMachine = createMachine(
  {
    id: "PullRequest",
    context: {
      firstReviewRequestedAt: null,
      firstReviewSubmittedAt: null,
      firstReviewDuration: null,

      readyLabeledAt: null,
      mergedAt: null,
      readyToMergedDuration: null,

      labels: [],
      requestedReviewers: [],
    },
    initial: 'opened',
    states: {
      opened: {
        on: {
          ...labelEvents,
          ReviewRequestedEvent: {
            target: 'reviewRequested',
            actions: ['addFirstReviewRequestedAt', 'addRequestedReviewer']
          },
          ReviewRequestRemovedEvent: {
            actions: ['removeRequestedReviewer']
          },
        }
      },
      reviewRequested: {
        on: {
          ...labelEvents,
          PullRequestReview: {
            target: 'reviewed',
            actions: ['addFirstReviewSubmittedAt'],
            cond: 'reviewerIsNotAuthor'
          },
          ReviewRequestRemovedEvent: [
            {
              actions: ['removeRequestedReviewer']
            }
          ],
          ReviewRequestedEvent: {
            actions: ['addRequestedReviewer']
          },
          '': {
            target: 'opened',
            actions: ['removeFirstReviewRequestedAt'],
            cond: 'noRequestedReviewers'
          }
        }
      },
      reviewed: {
        entry: 'computeFirstReviewDuration',
        on: {
          ...labelEvents,
          "": {
            target: 'labeledReady',
            cond: 'hasReadyLabel',
          }
        }
      },
      labeledReady: {
        on: {
          ...labelEvents,
          MergedEvent: {
            target: "merged",
            actions: ['addMergedAt']
          },
          "": {
            target: 'reviewed',
            cond: 'lacksReadyLabel'
          },
        }
      },
      merged: {
        entry: ['computeReadyToMergedDuration'],
        type: "final"
      },
      closed: {
        type: "final"
      },
    },
  },
  {
    actions: {
      addRequestedReviewer: assign((context, event) => {
        if (!event?.requestedReviewer?.id) return context;
        if (context.requestedReviewers.includes(event.requestedReviewer.id)) return context;

        return {
          ...context,
          requestedReviewers: [...context.requestedReviewers, event.requestedReviewer.id]
        }
      }),
      removeRequestedReviewer: assign((context, event) => {
        return {
          ...context,
          requestedReviewers: context.requestedReviewers.filter(id => id !== event.requestedReviewer.id)
        }
      }),
      addFirstReviewRequestedAt: assign((context, event) => {
        return {
          ...context,
          firstReviewRequestedAt: event.createdAt
        }
      }),
      removeFirstReviewRequestedAt: assign((context) => {
        return {
          ...context,
          firstReviewRequestedAt: null
        }
      }),
      addFirstReviewSubmittedAt: assign((context, event) => {
        return {
          ...context,
          firstReviewSubmittedAt: event.createdAt
        }
      }),
      computeFirstReviewDuration: assign((context) => {
        if (!context.firstReviewRequestedAt || !context.firstReviewSubmittedAt) {
          console.info(`Missing firstReviewRequestedAt ${context.firstReviewRequestedAt} or firstReviewSubmittedAt ${context.firstReviewSubmittedAt} returning from computeFirstReviewDuration`);
          return context;
        }
        // TODO: minus 16h * datediff(days, requested, submitted)

        const requested = Date.parse(context.firstReviewRequestedAt);
        const reviewed = Date.parse(context.firstReviewSubmittedAt)

        const onSameCalendarDay = context.firstReviewRequestedAt.slice(0, 10) === context.firstReviewSubmittedAt.slice(0, 10);

        let nightsAndWeekends;

        if (onSameCalendarDay) {
          nightsAndWeekends = 0;
        } else {
          const msInHour = 60 * 60 * 1000;
          const msInDay = 24 * msInHour;

          const omittedAmountPerDay = msInHour * 16; // -16 hours/day
          const omittedAmountPerWeekend = msInHour * 16 // - additional 16h/weekend

          let numDaysBetween = Math.floor((reviewed - requested) / msInDay);
          const numWeeksBetween = Math.floor(numDaysBetween / 7);

          // Different calendar day but less than 24 apart
          if (numDaysBetween === 0) numDaysBetween = 1;

          nightsAndWeekends = (numDaysBetween * omittedAmountPerDay) + (numWeeksBetween * omittedAmountPerWeekend);
        }

        return {
          ...context,
          firstReviewDuration: reviewed - requested - nightsAndWeekends
        }
      }),
      addLabel: assign((context, event) => {
        if (context.labels.includes(event.label.name)) return context;

        return {
          ...context,
          labels: [...context.labels, event.label.name]
        }
      }),
      removeLabel: assign((context, event) => {
        return {
          ...context,
          labels: context.labels.filter(label => label !== event.label.name)
        }
      }),
      maybeAddReadyLabeledAt: assign((context, event) => {
        if (event.label.name !== LABEL_READY) return context;

        return {
          ...context,
          readyLabeledAt: event.createdAt
        }
      }),
      maybeRemoveReadyLabeledAt: assign((context) => {
        if (context.labels.includes(LABEL_READY)) return context;

        return {
          ...context,
          readyLabeledAt: null
        }
      }),
      removeLabeledReadyAt: assign((context) => {
        return {
          ...context,
          readyLabeledAt: null
        }
      }),
      addMergedAt: assign((context, event) => {
        return {
          ...context,
          mergedAt: event.createdAt
        }
      }),
      computeReadyToMergedDuration: assign((context) => {
        if (!context.readyLabeledAt || !context.mergedAt) {
          console.info(`Missing readyLabeledAt ${context.readyLabeledAt} or mergedAt ${context.mergedAt} returning from computedReadyToMergedDuration`);
          return context;
        }

        const readied = Date.parse(context.readyLabeledAt);
        const merged = Date.parse(context.mergedAt)

        return {
          ...context,
          readyToMergedDuration: merged - readied
        }
      })
    },
    guards: {
      noRequestedReviewers: (context) => context.requestedReviewers.length === 0,
      hasReadyLabel: (context) => context.labels.includes(LABEL_READY),
      lacksReadyLabel: (context) => !context.labels.includes(LABEL_READY),
      reviewerIsNotAuthor: (context, event) => event.author.login !== context.login
    }
  }
)

export { pullRequestMachine }
