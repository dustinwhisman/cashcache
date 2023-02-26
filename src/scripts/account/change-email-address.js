firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    const credential = firebase.auth.EmailAuthProvider.credentialWithLink(user.email, window.location.href);
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
    const user = firebase.auth().currentUser;
    if (user) {
      user.updateEmail(event.target.elements['new-email'].value)
        .then(() => {
          window.location.href = '/account/';
        })
        .catch(console.error);
    } else {
      // this state should be unreachable, but you never know
      console.error('There was no logged in user with which to update their email.');
    }
  }
});
