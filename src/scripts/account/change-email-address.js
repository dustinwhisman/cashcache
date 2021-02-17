const credential = firebase.auth.EmailAuthProvider.credentialWithLink(appUser.email, window.location.href);

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    user.reauthenticateWithCredential(credential)
      .then(() => {
        const form = document.querySelector('[data-update-email-form]');
        form.removeAttribute('hidden');
      })
      .catch(() => {
        const errorMessage = document.querySelector('[data-credentials-invalid]');
        errorMessage.removeAttribute('hidden');
      });
  }
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.matches('[data-update-email-form]')) {
    appUser.updateEmail(event.target.elements['new-email'].value)
      .then(() => {
        window.location.href = '/account';
      })
      .catch(console.error);
  }
});
