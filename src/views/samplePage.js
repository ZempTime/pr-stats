import React from "react";

const Styles = () => {
  return (
    <style>
      {`
    .title {
      color: var(--aha-green-800);
      font-size: 20px;
      text-align: center;
      margin: 20px;
    }
    `}
    </style>
  );
};

aha.on("samplePage", ({ record, fields }, { settings }) => {
  return (
    <>
      <Styles />
      <div className='title'>Sample page</div>
    </>
  );
});