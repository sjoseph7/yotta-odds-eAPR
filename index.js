const COST_PER_TICKET = 2500; // $25
const ISSUED_TICKETS_PER_WEEK = 10000000; // 10 million tickets
const BASE_APY = 0.2; // 0.20%

let yottaData = [];

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
    yottaData = data;

    console.table(data);
    return data;
  })
  .then(data => {
    const [lowerValue, nominalValue, upperValue] = computeEAprValuesFromData(
      data,
      2500
    );
    loading = false;
    updateTableWithData(prizesAndOdds, data);
    updateEAprValues(
      [lowerBound, nominal, upperBound],
      [lowerValue, nominalValue, upperValue]
    );
    return data;
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
  oddsTable.childNodes.forEach(childNode => {
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
        matches: parseInt(matchingNumbers.split(" of ")[0]),
        annuity: prize.includes("**") ? 40 : 0, // years
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

function computeEAprValuesFromData(
  data = yottaData,
  balance = COST_PER_TICKET,
  extraTickets = 0,
  ticketsPerWeek = approximateTicketsIssuedInput.value ||
    ISSUED_TICKETS_PER_WEEK
) {
  const tickets = parseInt(balance / COST_PER_TICKET) + extraTickets;
  const expectedValue = oddsItem =>
    oddsItem.prize * (oddsItem.odds.num / oddsItem.odds.den);

  /**
   * The lower bound assumes only infinite people are playing
   *    the Yotta lottery
   */
  const lowerBound = data.reduce(
    (sum, oddsItem) =>
      oddsItem.shared
        ? sum // exclude shared prizes
        : (sum += expectedValue(oddsItem)),
    0
  );

  /**
   * The "nominal" rate uses the estimated number of tickets
   *    issueed per week.
   *
   * Help from -> https://bit.ly/yottaev
   * Special thanks to [Ask Sebby] for providing an equation
   *    for calculating expected value based on the number
   *    of tickets issued per week.
   */
  const nominal = data.reduce(
    (sum, oddsItem) =>
      oddsItem.shared
        ? (sum +=
            expectedValue(oddsItem) / (1 + ticketsPerWeek / oddsItem.odds.den))
        : (sum += expectedValue(oddsItem)),
    0
  );

  console.log("NOM", nominal);
  /**
   * The upper bound assumes only one person is playing the
   *    Yotta lottery.
   */
  const upperBound = data.reduce((sum, oddsItem) => {
    sum += expectedValue(oddsItem);
    return sum;
  }, 0);

  return [
    ((lowerBound * tickets) / balance) * 100 * 52 + BASE_APY,
    ((nominal * tickets) / balance) * 100 * 52 + BASE_APY,
    ((upperBound * tickets) / balance) * 100 * 52 + BASE_APY
  ];
}
