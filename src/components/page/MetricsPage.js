import React, { useEffect, useState } from "react";
import { print } from "graphql";
import { gql } from "graphql-tag";
import { IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS, FIELD_ACCOUNT_PULL_REQUESTS_MEDATA } from "../../extension";

import { Metadata } from "../Metadata";
import { TimeToFirstReviewMetric } from "../TimeToFirstReviewMetric";
import { ReadyToMergedMetric } from "../ReadyToMergedMetric";
import { PrExaminer } from "../PrExaminer";

const MetricsQuery = gql`
  query MetricsQuery($identifier: String!) {
    account {
      extensionFields(filters: { extensionIdentifier: $identifier }) {
        name
        value
      }
    }
  }
`;

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

const fetchMetricsQuery = async (metricsQuery, setMetricsQuery) => {
  try {
    setMetricsQuery({ ...metricsQuery, status: PROMISE_STATES.pending });

    const variables = {
      identifier: IDENTIFIER
    };
    const data = await aha.graphQuery(print(MetricsQuery), { variables });

    setMetricsQuery({ ...metricsQuery, status: PROMISE_STATES.success, data});
  } catch (e) {
    setMetricsQuery({ ...metricsQuery, status: PROMISE_STATES.error, error: e })
  }
}

export const MetricsPage = ({ teams, repos }) => {
  const [metricsQuery, setMetricsQuery] = useState(initialQueryState);

  useEffect(() => {
    fetchMetricsQuery(metricsQuery, setMetricsQuery);
  }, [])

  const { status, error, data } = metricsQuery;

  if ([PROMISE_STATES.notasked, PROMISE_STATES.pending].includes(status)) {
    return (
      <>
        <aha-spinner size="5em"></aha-spinner>
      </>
    )
  }

  if (status === PROMISE_STATES.error) {
    return (
      <>
        <p>There was an error. Please contact support@aha.io</p>
        <p>Nah I'm jk ping @czempel</p>
      </>
    )
  }

  if (status === PROMISE_STATES.success) {
    const metadata = data.account.extensionFields.find(field => field.name === FIELD_ACCOUNT_PULL_REQUESTS_MEDATA);
    const isBucket = /account.pull_requests_\d/;
    const buckets = data.account.extensionFields.filter(entry => isBucket.test(entry.name));
    const pullRequests = Object.values(buckets).map(bucket => bucket.value).flat();

    return (
      <>
        <Metadata metadata={metadata.value} />

        <TimeToFirstReviewMetric pullRequests={pullRequests} teams={teams} />
        <ReadyToMergedMetric pullRequests={pullRequests} />
        {/* <PrExaminer /> */}
      </>
    )
  }
}
