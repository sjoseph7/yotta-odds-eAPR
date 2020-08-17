const COST_PER_TICKET = 2500; // $25
const ISSUED_TICKETS_PER_WEEK = 10000000; // 10 million tickets
const BASE_APY = 0.2; // 0.20%
const BACKEND_API_ENDPOINT = `http://localhost:4000/api/v1/prize-data?limit=1&sort=-createdAt`;
const YOTTA_DATA_KEY = "YOTTA_DATA_KEY";
const REFRESH_TIME = 1000 * 60 * 15; // every 15 minutes

let yottaData = [];

(async function () {
  let rows = [];
  // Use locally stored data if it exists...
  if (
    localStorage &&
    localStorage.getItem(YOTTA_DATA_KEY) &&
    Date.now() - JSON.parse(localStorage.getItem(YOTTA_DATA_KEY)).lastUpdated <
      REFRESH_TIME
  ) {
    const data = JSON.parse(localStorage.getItem(YOTTA_DATA_KEY));
    console.info("Using stored data");
    rows = data.rows;
  } else {
    // ...otherwise get data from backend
    rows = await fetch(BACKEND_API_ENDPOINT).then(async function (response) {
      try {
        console.info("Getting new data");
        const json = await response.json();
        return json.data[0] && json.data[0].rows;
      } catch (err) {
        return [];
      }
    });
  }
  const [lowerValue, nominalValue, upperValue] = computeEAprValuesFromData(
    rows,
    2500
  );
  loading = false;
  updateTableWithData(prizesAndOdds, rows);
  updateEAprValues(
    [lowerBound, nominal, upperBound],
    [lowerValue, nominalValue, upperValue]
  );

  localStorage.setItem(
    YOTTA_DATA_KEY,
    JSON.stringify({
      rows,
      lastUpdated: Date.now()
    })
  );
  yottaData = rows;
  return rows;
})();

function computeEAprValuesFromData(
  data = yottaData,
  balance = COST_PER_TICKET,
  extraTickets = 0,
  ticketsPerWeek = approximateTicketsIssuedInput.value ||
    ISSUED_TICKETS_PER_WEEK
) {
  const tickets = parseInt(balance / COST_PER_TICKET) + extraTickets;
  const expectedValue = oddsItem =>
    oddsItem.prize * (oddsItem.odds.numerator / oddsItem.odds.denominator);

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
            expectedValue(oddsItem) /
            (1 + ticketsPerWeek / oddsItem.odds.denominator))
        : (sum += expectedValue(oddsItem)),
    0
  );

  /**
   * The upper bound assumes only one person is playing the
   *    Yotta lottery.
   */
  const upperBound = data.reduce((sum, oddsItem) => {
    sum += expectedValue(oddsItem);
    return sum;
  }, 0);

  return [
    ((lowerBound * tickets) / balance) * 100 * 52,
    ((nominal * tickets) / balance) * 100 * 52,
    ((upperBound * tickets) / balance) * 100 * 52
  ];
}
