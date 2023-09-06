const loginURL: string = window.location.origin + '/login';

document.querySelector('form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  let username = (document.getElementById('username') as HTMLInputElement).value;
  let password = (document.getElementById('password') as HTMLInputElement).value;

  try {
    const response = await fetch(loginURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if (response.ok) {
      window.location.href = '/'; // Redirect to dashboard
    } else {
      const errorMessage = await response.text();
      const loginMessage = document.getElementById('message');
      if (loginMessage) {
        loginMessage.textContent = errorMessage;
      }
    }

  }
  catch (error) {
    console.error(error);
  }
});