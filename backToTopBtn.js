/**
 *
 * @author sjoseph7
 *
 * This manages the visibility of the button that appears
 *    when users have scrolled away from the top of the page.
 *
 */

const MINIMUM_DISTANCE_FROM_TOP = 50;

window.onscroll = function () {
  determineButtonVisibility(goToTopBtn);
};

/**
 * If the user has moved far enough away from the top of
 *    the page, allow them to view the button
 */
function determineButtonVisibility(button) {
  if (
    document.body.scrollTop > MINIMUM_DISTANCE_FROM_TOP ||
    document.documentElement.scrollTop > MINIMUM_DISTANCE_FROM_TOP
  ) {
    button.style.display = "block";
  } else {
    button.style.display = "none";
  }
}

function goToTopOfPage() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
