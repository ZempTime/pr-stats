import React from "react";
import { Styles } from "./Styles";

export const ExtensionRoot = ({ children }) => {
  return (
    <>
      <Styles />
      <div className="firstReviewContainer">
        {children}
      </div>
    </>
  );
};
