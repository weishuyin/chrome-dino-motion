export const GAME_SPEEDS = [0.1, 0.25, 0.5, 0.75, 1];
const STORAGE_KEY = 'dinosaur-game-speed';

export function setupGameSpeed(runner, select, storage) {
  // Replace Chromium's hidden binary accessibility setting with the visible selector.
  runner.slowSpeedCheckboxLabel.hidden = true;
  runner.showSpeedToggle = () => {};
  runner.toggleSpeed = () => {};

  const apply = value => {
    const rate = Number(value);
    runner.scrollRate = GAME_SPEEDS.includes(rate) ? rate : 1;
    select.value = String(runner.scrollRate);
  };
  let saved;
  try { saved = storage?.getItem(STORAGE_KEY); } catch {}
  apply(saved);
  select.addEventListener('change', () => {
    apply(select.value);
    try { storage?.setItem(STORAGE_KEY, String(runner.scrollRate)); } catch {}
    select.blur();
  });
}
