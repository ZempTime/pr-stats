aha.on("sampleCommand", ({ record }, { settings }) => {
  if (record) {
    aha.commandOutput(
      `Running sample command for record: ${record.typename} / ${record.referenceNum}.`
    );
  } else {
    aha.commandOutput(`Running sample command without a record.`);
  }
});