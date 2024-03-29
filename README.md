# Yotta Odds eAPR 
A web app designed to estimate the effective APR of Yotta's Savings accounts, found [here](https://yotta-odds-eapr.netlify.app/).

Yotta, presumably named after the [largest decimal unit prefix](https://en.wikipedia.org/wiki/Yotta-) in the metric
system, is a prize-linked savings account that gamifies saving money. In addition to offering a traditional
interest rate, Yotta gives savers weekly opportunities to win cash prizes. These prizes can be treated as interest
on the balance in the account, but due to the random nature of winning a prize in a "sweepstakes" it can be difficult
to estimate the account's APR, or annual percentage rate (of return). This calculator estimates the effective APR 
("eAPR") using Yotta's publicly available odds of winning (see [official rules](https://www.withyotta.com/official-rules)) and can also estimate a "nominal" eAPR based on the number of tickets issued.

Yotta also provides a base 0.20% APY, which has been **excluded** from this APR estimate - this is because `APR` only takes _simple interest_ into account, while `APY` accounts for compound interest.
