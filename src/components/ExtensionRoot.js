import { AuthProvider } from "@aha-app/aha-develop-react";
import React from "react";
import { Styles } from "./Styles";
import { GITHUB_AUTH_SCOPE } from "../extension";

export const ExtensionRoot = ({ children }) => {
  return (
    <>
      <Styles />
      <AuthProvider serviceName="github" serviceParameters={{ scope: GITHUB_AUTH_SCOPE }}>
        <div className="firstReviewContainer">
          {children}
        </div>
      </AuthProvider>
    </>
  );
};
