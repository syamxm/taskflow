(function () {
  var theme = 'dark';
  try {
    if (localStorage.getItem('taskflow-theme') === 'pink') theme = 'pink';
  } catch (e) {
    /* storage blocked — fall back to dark */
  }
  document.documentElement.dataset.theme = theme;
})();
