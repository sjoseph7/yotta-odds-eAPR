const COST_PER_TICKET = 2500; // $25
const ISSUED_TICKETS_PER_WEEK = 10000000; // 10 million tickets
const BASE_APY = 0.2; // 0.20%
const BACKEND_API_ENDPOINT = `http://localhost:4000/api/v1/prize-data?limit=1&sort=-createdAt`;

let yottaData = [];

fetch(BACKEND_API_ENDPOINT)
  .then(async function (response) {
    try {
      const json = await response.json();
      console.debug(json);
      return json.data[0] && json.data[0].rows;
    } catch (err) {
      return [];
    }
  })
  .then(data => {
    console.debug(data);
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
    ((lowerBound * tickets) / balance) * 100 * 52,
    ((nominal * tickets) / balance) * 100 * 52,
    ((upperBound * tickets) / balance) * 100 * 52
  ];
}
