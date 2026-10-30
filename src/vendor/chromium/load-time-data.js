// Browser compatibility adapter for Chromium's internal localized data service.
const strings = {dinoGameA11yAriaLabel: 'Dinosaur 跑酷', dinoGameA11yDescription: '按空格跳跃，向下键蹲下。', dinoGameA11yGameOver: '游戏结束', dinoGameA11yJump: '跳跃', dinoGameA11yHighScore: '最高分 $1', dinoGameA11yStartGame: '游戏开始', dinoGameA11ySpeedToggle: '降低速度'};
export const loadTimeData = {valueExists: key => Object.hasOwn(strings, key), getString: key => strings[key], getValue: key => strings[key]};
