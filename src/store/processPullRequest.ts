import { interpret } from "xstate/es";
import { pullRequestMachine } from "../store/pullRequestMachine";
import { GetPrQuery, } from "../generated/graphql"
import { IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS } from "../extension"

export const processPullRequest = async (
  { record, pullRequest }: { record: any, pullRequest: GetPrQuery['repository']['pullRequest'] }
) => {
  const { id, title, url, author: { login }, timelineItems } = pullRequest;
  console.info(`Processing pr: ${url} by ${login}`);

  const events = timelineItems.nodes.map((item) => {
    return {
      ...item,
      type: item.__typename
    }
  });

  const prService = interpret(pullRequestMachine).onTransition((state) => {
    console.info(`event: ${state._event.name}`);
    console.info(`state: ${state.value}`);
    console.info(`context: ${JSON.stringify(state.context, null, 2)}`);
  });

  prService.start();

  debugger
  events.forEach(event => prService.send(event));

  const { value, context } = prService.state;

  prService.stop();

  const updatedPr = {
    id,
    title,
    url,
    login,
    state: {
      value,
      context
    }
  };

  const existingPrs = await record.getExtensionField(IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS);

  const pullRequests = [
    ...(existingPrs || []).filter(pr => pr.id !== updatedPr.id),
    updatedPr
  ]

  console.info(`Updating ${IDENTIFIER} ${FIELD_ACCOUNT_PULL_REQUESTS} with:`);
  console.info(JSON.stringify(updatedPr, null, 2));

  await record.setExtensionField(IDENTIFIER, FIELD_ACCOUNT_PULL_REQUESTS, pullRequests);
}
