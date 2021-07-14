import { useState, useEffect }, React from "react";

const initialQueryState = {
  loading: false,
  data: null
};

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

const FirstReviewPage = () => {
  const [firstReviewsQuery, setFirstReviewsQuery] = useState(initialQueryState);

  useEffect(() => {
    async function fetchFirstReviews() {
      const query = `
        extensionFields(filters: {extensionFieldableType: FEATURE, extensionIdentifier: "zemptime.pr-stats", name: "firstReviews"}) {
          nodes {
            name
            value
            extensionFieldable {
              ... on Requirement {
                id
                name
              }
              ... on Feature {
                id
                name
              }
            }
          }
        }
      `;

      setFirstReviewsQuery({ ...favoritesQuery, loading: true });
      const data = await aha.graphQuery(query);
      setFirstReviewsQuery({ loading: false, data });
    };
    fetchFirstReviews();
  }, [])

  if (firstReviewsQuery.loading) {
    return (
      <div className='title'>
        Loading First Review Info...
        <aha-spinner></aha-spinner>
      </div>
    )
  }

  return (
    <>
      <Styles />
      <div className='title'>First Review</div>
    </>
  );
}

aha.on("firstReviewPage", ({ record, fields }, { settings }) => {
  return (
    <FirstReviewPage />
  );
});
