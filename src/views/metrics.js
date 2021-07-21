import React from "react";
import { ExtensionRoot } from "../components/ExtensionRoot"
import { MetricsPage } from "../components/page/MetricsPage"

aha.on("metricsPage", ({ record, fields }, { identifier, settings }) => {
  const teams = settings.get("firstReviews");
  const repos = settings.get("repos");

  return (
    <ExtensionRoot>
      <MetricsPage teams={teams} repos={repos}></MetricsPage>
    </ExtensionRoot>
  );
});
