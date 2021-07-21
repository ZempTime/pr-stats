import { interpret } from "xstate/es";
import { pullRequestMachine } from "../store/pullRequestMachine";

export const computeUpdatedPr = (pullRequest) => {
  const { id, title, url, createdAt, author: { login }, timelineItems } = pullRequest;
  console.group(`Processing pr: ${url} by ${login}`);

  const events = timelineItems.nodes.map((item) => {
    return {
      ...item,
      type: item.__typename
    }
  });

  const prService = interpret(pullRequestMachine).onTransition((state) => {
    console.group(`pull request machine ${url}`)
    console.debug(`event: ${state._event.name}`);
    console.debug(`state: ${state.value}`);
    console.debug(`context: ${JSON.stringify(state.context, null, 2)}`);
    console.groupEnd
  });

  prService.start();

  events.forEach(event => prService.send(event));

  const { value, context } = prService.state;

  prService.stop();
  console.groupEnd();

  return {
    id,
    createdAt,
    title,
    url,
    login,
    state: {
      value,
      context
    }
  };
}
