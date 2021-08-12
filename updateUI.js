// Update number of recurring tickets
yottaBalance.addEventListener("keyup", () =>
  updateUserEntries(yottaBalance, recurringTickets)
);

// Update number of tickets issues per week
approximateTicketsIssuedRange.addEventListener("input", (e) => {
  approximateTicketsIssuedInput.value = parseInt(e.target.value);
  updateNominalValue();
});
approximateTicketsIssuedInput.addEventListener("keyup", (e) => {
  approximateTicketsIssuedRange.value = parseInt(e.target.value);
  updateNominalValue();
});

// Update displayed nominal value
function updateNominalValue() {
  const approximateTicketsIssued = approximateTicketsIssuedInput.value;
  const [lowerValue, nominalValue, upperValue] = computeEAprValuesFromData(
    undefined,
    parseInt(yottaBalance.value * 100) || 2500,
    undefined,
    approximateTicketsIssued
  );

  updateEAprValues(
    [lowerBound, nominal, upperBound],
    [lowerValue, nominalValue, upperValue]
  );
}

// Update table containing odds and prize data
function updateTableWithData(table, data = {}) {
  const headers = ["Matches Yotta Ball", "Number of Matches", "Prize*", "Odds"];

  clearTable(table);
  addHeadersToTable(table, headers);
  addDataToTable(table, data);
}

// Update number of displayed recurring tickets
function updateUserEntries(balanceInput, ticketText) {
  const balance = parseInt(balanceInput.value * 100);

  // Number of tickets decreases (from $25 to $150) over $10k
  const below10k = Math.min(balance, 1000000);
  const above10k = Math.max(balance - 1000000, 0);
  const totalTickets = parseInt((below10k || 2500)/2500) + parseInt(above10k/15000)

  ticketText.innerText = numberWithCommas(totalTickets);
}

// Update nominal and lower/upper bounds using row data from API
function updateUiFromRows(rows) {
  const [lowerValue, nominalValue, upperValue] = computeEAprValuesFromData(
    rows,
    COST_PER_TICKET
  );
  loading = false;
  updateTableWithData(prizesAndOdds, rows);
  updateEAprValues(
    [lowerBound, nominal, upperBound],
    [lowerValue, nominalValue, upperValue]
  );
}

// ==== HELPERS ==== //
// Update displayed text for nominal and upper/lower bounds
function updateEAprValues(
  [lowerElement, nominalElement, upperElement] = [],
  [lowerValue, nominalValue, upperValue] = []
) {
  lowerElement.innerText = `${lowerValue.toFixed(2)}%`;
  nominalElement.innerText = `${nominalValue.toFixed(2)}%`;
  upperElement.innerText = `${upperValue.toFixed(2)}%`;
}

// Clear any provided table
function clearTable(table) {
  table.innerHTML = "";
}

// Add provided headers to provided table
function addHeadersToTable(table, headers) {
  const thead = document.createElement("thead");
  const thead_tr = document.createElement("tr");
  const thead_ths = headers.forEach((text) => {
    const th = document.createElement("th");
    th.innerText = text;
    thead_tr.appendChild(th);
  });
  thead.appendChild(thead_tr);
  table.appendChild(thead);
}

// Add provided data to provided table
function addDataToTable(table, data) {
  const tbody = document.createElement("tbody");
  data.forEach((row) => {
    const { yotta, shared, matches, prize, odds, annuity } = row;
    const tr = document.createElement("tr");

    function addDataColumnToRow(row, text) {
      const td = document.createElement("td");
      td.innerText = text;
      row.appendChild(td);
    }

    addDataColumnToRow(tr, yotta ? "Yes" : "No");
    addDataColumnToRow(tr, `${matches} of 6`);
    const prizeValue =
      prize / 100 < 1 && prize !== 0
        ? (prize / 100).toFixed(2)
        : numberWithCommas(prize / 100);
    addDataColumnToRow(
      tr,
      `$${prizeValue}${shared ? "" : " per ticket"}${annuity > 0 ? "**" : ""}`
    );
    addDataColumnToRow(
      tr,
      `${odds.numerator}:${numberWithCommas(odds.denominator)}`
    );

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

// Display numbers with commas
function numberWithCommas(number) {
  // Help from -> https://stackoverflow.com/a/2901298
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
