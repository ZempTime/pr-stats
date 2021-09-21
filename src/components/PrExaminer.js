import React, { useState } from "react";
import { validPrUrl } from "../lib/common";
import { getPrByUrl } from "../lib/github/pullRequest";
import { withGitHubApi } from "../lib/github/api";
import { explainPullRequest } from "../store/pullRequest";

const explain = async (url, setExplain) => {
  await withGitHubApi(async (api) => {
    const pullRequest = await getPrByUrl(api, url);
    const [updatedPullRequest, transitions] = explainPullRequest(pullRequest);
    setExplain({
      updatedPullRequest,
      transitions,
      hasInfo: true
    });
  });
}

export const PrExaminer = () => {
  const [prUrl, setPrUrl] = useState();
  const [error, setError] = useState(null);
  const [explainInfo, setExplainInfo] = useState({ hasInfo: false });

  const handleInput = (e) => {
    console.log(e.target.value);
    setPrUrl(e.target.value);
  }

  const handleExplain = () => {
    debugger;
    let urlString = '';
    if (!validPrUrl(urlString)) {
      setError("Please enter a valid pull request URL");
      return;
    }

    setError(null);

    explain(urlString, setExplainInfo)
  }

  let explanation;

  if (explainInfo.hasInfo) {
    explanation = (
      <pre>
        {JSON.stringify(explainInfo, null, 2)}
      </pre>
    )
  }

  return (
    <aha-panel heading="Pr Examiner">
      <p>You can use this to interrogate how the state chart currently processes a given PR.</p>
      <form>
        <input value={prUrl} onInput={handleInput} type="text" placeholder="https://github.com/org/repo/1234" />
        <aha-button onClick={handleExplain}>Explain</aha-button>
      </form>

      {explanation}
    </aha-panel>
  )
}
