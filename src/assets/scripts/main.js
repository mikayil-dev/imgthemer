document.addEventListener('DOMContentLoaded', () => {
  // Set dark mode on page load
  const darkModeCookie = localStorage.getItem('dark-mode');

  if (
    darkModeCookie === 'true' ||
    (!darkModeCookie &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement?.setAttribute('data-dark-active', '');
    document
      .querySelector('header button.darkmode-toggle')
      ?.setAttribute('data-dark-active', '');
    localStorage.setItem('dark-mode', 'true');
  }
});
