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

        return {
          ...context,
          firstReviewDuration: reviewed - requested
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
