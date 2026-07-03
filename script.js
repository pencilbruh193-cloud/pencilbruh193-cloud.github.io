const buttons = document.querySelectorAll('.game-btn');

const links = {
  ShreckEscape: 'https://sites.google.com/view/drive-u-7-home/shrek-escape-from-the-swamp',
  TemuGeoDash: 'https://sites.google.com/view/drive-u-7-home/new-games/level-67',
  UltraKill: 'https://sites.google.com/view/drive-u-7-home/ultrapin'
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
