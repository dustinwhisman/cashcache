export const updateBackLink = () => {
  if (document.referrer) {
    const backLink = document.querySelector('[data-back-link]');
    backLink.href = document.referrer;
  }
}
