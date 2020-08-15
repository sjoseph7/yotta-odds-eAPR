const COST_PER_TICKET = 2500; // $25
const MINIMUM_APR = 0.2; // 0.20%

const officialRulesUrl = "https://www.withyotta.com/official-rules";
const officialRulesHtml = fetch(
  `https://cors-anywhere.herokuapp.com/${officialRulesUrl}`
)
  .then(function (response) {
    return response.text();
  })
  .then(function (html) {
    // Convert HTML into Document Object
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    return doc;
  })
  .then(function (doc) {
    const oddsTable = getOddsTableFromDoc(doc);
    const data = getDataFromOddsTable(oddsTable);

    console.table(data);
    return data;
  })
  .then(data => {
    console.debug(computeExpectedValuesFromData(data, 2500));
  })
  .catch(function (err) {
    console.error("ERROR:", err.message);
  });

const getOddsTableFromDoc = function (doc) {
  /**
   * This table appears to be the first table on the page,
   *    but this may not always be
   */
  const oddsTable = doc.getElementsByClassName("w-layout-grid rules-table")[0];
  return oddsTable;
};

const getDataFromOddsTable = function (oddsTable) {
  /**
   * This table is made up of div blocks and not header, row,
   *    and data elements, so the header blocks need to be
   *    filtered out. The remaining blocks need to be placed
   *    into groups of 4 and have any excess html removed
   */

  const tableBodyData = [];
  oddsTable.childNodes.forEach((childNode, index) => {
    if (
      ![...childNode.classList].includes("table-header") && // Filter out header data
      childNode.firstElementChild.firstElementChild // Filter out error-generating blank cells
    ) {
      tableBodyData.push(
        childNode.firstElementChild.firstElementChild.innerText // Remove excess html
      );
    }
  });

  // Place into groups of 4
  const tableRows = [];
  for (let i = 0; i < tableBodyData.length; i += 4) {
    let tableRow = [
      tableBodyData[i],
      tableBodyData[i + 1],
      tableBodyData[i + 2],
      tableBodyData[i + 3]
    ];
    tableRows.push(tableRow);
  }

  function getDataFromTableRows(tableRows) {
    const odds = tableRows.map(tableRow => {
      const [hasYotta, matchingNumbers, prize, odds] = tableRow;
      console.info([hasYotta, matchingNumbers, prize, odds]);
      return {
        yotta: hasYotta === "Yes",
        shared: !prize.includes("per ticket"),
        matching: parseInt(matchingNumbers.split(" of ")[0]),

        // Prize is in cents, USD
        prize: prize.includes("**")
          ? 5800000 * 100 // TODO: fix 40 year annuity calculation
          : parseInt(prize.slice(1).split(" per ")[0].replace(/,/g, "") * 100),
        odds: {
          num: parseInt(odds.split(":")[0]),
          den: parseInt(odds.split(":")[1].replace(/,/g, ""))
        }
      };
    });

    return odds;
  }

  // Extract data
  const data = getDataFromTableRows(tableRows);
  console.info("data:", data);
  return data;
};

const computeExpectedValuesFromData = (data, balance = COST_PER_TICKET) => {
  const tickets = parseInt(balance / COST_PER_TICKET);

  /**
   * This is the lower bound and assumes only infinite people are
   *    playing the Yotta lottery
   */
  const lowerBound = data.reduce(
    (sum, oddsItem) =>
      oddsItem.shared
        ? sum // exclude shared prizes
        : (sum += oddsItem.prize * (oddsItem.odds.num / oddsItem.odds.den)),
    0
  );

  /**
   * This is the upper bound and assumes only one person is
   *    playing the Yotta lottery
   */
  const upperBound = data.reduce((sum, oddsItem) => {
    sum += oddsItem.prize * (oddsItem.odds.num / oddsItem.odds.den);
    return sum;
  }, 0);

  return [
    ((lowerBound * tickets) / balance) * 100 * 52,
    ((upperBound * tickets) / balance) * 100 * 52
  ];
};
