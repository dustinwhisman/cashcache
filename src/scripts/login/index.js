document.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = event.target.elements.email.value;
  firebase.auth().sendSignInLinkToEmail(email, {
    url: `${window.location.origin}/login/confirm/`,
    handleCodeInApp: true,
  })
    .then(() => {
      localStorage.setItem('emailForSignIn', email);
      window.location.href = '/login/awaiting-login-confirmation/';
    })
    .catch(console.error);
});
