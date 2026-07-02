const buttons = document.querySelectorAll('.game-btn');

const links = {
  paperio: 'https://paperiogame.io/',
  dodge: 'https://dodgearena.com/',
  clicker: 'https://clicksurvival.com/'
};

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const game = btn.dataset.game;
    const target = links[game];
    if (target) {
      window.location.href = target;
    } else {
      alert('Selected: ' + game);
    }
  });
});
