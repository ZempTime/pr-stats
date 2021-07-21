import { LABEL_SUPPORT_FIX } from "../extension";

export const teamLoginsFilter = (teamLogins) => (pr) => teamLogins.includes(pr.login.toLowerCase());
export const notSupportFilter = (pr) => !pr.state.context.labels.includes(LABEL_SUPPORT_FIX);
export const isSupportFilter = (pr) => pr.state.context.labels.includes(LABEL_SUPPORT_FIX);
export const hasFirstReviewDurationFilter = (pr) => !!pr.state.context.firstReviewDuration;
export const hasFirstReviewRequestedAtFilter = (pr) => !!pr.state.context.firstReviewRequestedAt
export const hasReadyToMergedDurationFilter = (pr) => !!pr.state.context.readyToMergedDuration;
export const hasReadyLabeledAtFilter = (pr) => !!pr.state.context.readyLabeledAt;
