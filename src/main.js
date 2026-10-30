import { setupGameSpeed } from './speed-control.js';
import { Runner } from './vendor/chromium/offline.js';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { LearnedJumpDetector } from './learned-jump-detector.js';
import { validateModel } from './jump-features.js';
import './style.css';

async function main() {
  const $ = id => document.getElementById(id);
  // Ensure Runner initializes its distance meter before restoring the score.
  await Promise.all([...document.querySelectorAll('#offline-resources > img')].map(image => image.decode()));
  // Space controls the game even after a camera button was clicked.
  // Cancel the button's default Space activation without stopping Runner's input.
  for (const type of ['keydown', 'keyup']) {
    document.addEventListener(type, event => {
      if (event.target.tagName === 'SELECT' || event.target.type === 'checkbox') {
        event.stopPropagation();
        return;
      }
      if (event.code === 'Space' && event.target.closest?.('button')) event.preventDefault();
    }, true);
  }
  const runner = new Runner('#game');
  let preferences;
  try { preferences = window.localStorage; } catch {}
  setupGameSpeed(runner, $('game-speed'), preferences);
  const invincible = $('invincible');
  // Default off on every page load; keep the choice across game restarts.
  invincible.checked = false;
  runner.invincible = false;
  invincible.addEventListener('change', () => {
    runner.invincible = invincible.checked;
    invincible.blur();
  });
  // Scale the original 600×150 game as a whole; keep upstream physics and
  // obstacle timing at their original logical resolution.
  const stage = $('stage');
  const resizeGame = () => {
    $('game').style.setProperty('--game-scale', stage.clientWidth / 600);
  };
  new ResizeObserver(resizeGame).observe(stage);
  resizeGame();

  const detector = new LearnedJumpDetector();
  const video = $('video');
  let stream = null, pose = null, loading = null, generation = 0;
  let previousVideoTime = -1, releaseTimer = null;

  // Keep Chromium's own input handling, physics, scoring and rendering intact.
  // A detected body jump is equivalent to holding Space for 180ms.
  function motionJump() {
    if (!runner.tRex || document.hidden) return;
    const event = type => ({type, keyCode: 32, target: runner.canvas, preventDefault() {}});
    if (runner.crashed) {
      // gameOver() also sets paused; process crashes before the pause guard.
      runner.onKeyUp(event('keyup'));
      return;
    }
    if (runner.paused) return;
    runner.onKeyDown(event('keydown'));
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(() => runner.onKeyUp(event('keyup')), 180);
  }

  try { runner.initializeHighScore(Number(localStorage.getItem('dinosaur-high-score')) || 0); } catch {}
  const saveHighScore = runner.saveHighScore.bind(runner);
  runner.saveHighScore = (score, reset) => {
    saveHighScore(score, reset);
    try { localStorage.setItem('dinosaur-high-score', String(runner.highestScore)); } catch {}
  };

  async function loadModels() {
    if (!loading) loading = (async () => {
      const root = import.meta.env.BASE_URL;
      const [vision, response] = await Promise.all([
        FilesetResolver.forVisionTasks(`${root}vendor/mediapipe/wasm`),
        fetch(`${root}models/jump-visible-mlp.json`),
      ]);
      if (!response.ok) throw new Error('跳跃模型加载失败');
      const jump = validateModel(await response.json());
      const nextPose = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {modelAssetPath: `${root}models/pose_landmarker_lite.task`, delegate: 'CPU'},
        runningMode: 'VIDEO', numPoses: 1,
        minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5,
      });
      return {jump, pose: nextPose};
    })().catch(error => { loading = null; throw error; });
    const models = await loading;
    pose = models.pose;
    detector.setModel(models.jump);
  }

  function stopCamera(message = '摄像头已关闭，可继续按空格游戏。') {
    generation++;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    video.hidden = true;
    previousVideoTime = -1;
    detector.reset();
    clearTimeout(releaseTimer);
    // Release any outstanding motion input without restarting a crashed game.
    if (runner.tRex?.jumping) runner.tRex.endJump();
    $('camera-start').disabled = false;
    $('camera-stop').disabled = true;
    $('status').textContent = message;
  }

  async function startCamera() {
    stopCamera();
    const token = generation;
    $('camera-start').disabled = true;
    $('camera-stop').disabled = false;
    $('status').textContent = '正在连接摄像头、加载本地识别模型…';
    try {
      if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('请使用 HTTPS 或 localhost 打开');
      const next = await navigator.mediaDevices.getUserMedia({audio: false, video: {
        facingMode: 'user', width: {ideal: 640}, height: {ideal: 480}, frameRate: {ideal: 30, max: 30},
      }});
      if (token !== generation) { next.getTracks().forEach(track => track.stop()); return; }
      stream = next;
      video.srcObject = next;
      video.hidden = false;
      next.getVideoTracks()[0].addEventListener('ended', () => {
        if (stream === next) stopCamera('摄像头已断开，可继续按空格游戏。');
      });
      await Promise.all([video.play(), loadModels()]);
      if (token !== generation) return;
      detector.reset();
      $('status').textContent = '请让头部或肩膀入镜，站稳片刻完成校准。';
      requestAnimationFrame(now => infer(now, token));
    } catch (error) {
      if (token !== generation) return;
      const messages = {NotAllowedError: '未获得摄像头权限，可继续用空格游戏。', NotFoundError: '未找到摄像头，可继续用空格游戏。', NotReadableError: '摄像头被占用，请关闭其他占用程序后重试。'};
      stopCamera(messages[error.name] || `体感启动失败：${error.message}`);
    }
  }

  function infer(now, token) {
    if (token !== generation || !stream) return;
    try {
      if (!document.hidden && pose && video.readyState >= 2 && video.currentTime !== previousVideoTime) {
        previousVideoTime = video.currentTime;
        const points = pose.detectForVideo(video, now).landmarks[0];
        const tracking = detector.update(points, now, Number($('sensitivity').value));
        $('status').textContent = !tracking.tracked ? '请让头部或肩膀进入镜头，空格仍可操作。' : !tracking.ready ? '请站稳片刻，正在校准…' : `体感已就绪（${tracking.source}）· 原地跳跃即可控制`;
        if (tracking.jump) motionJump();
      }
    } catch (error) {
      stopCamera(`动作识别中断：${error.message}。可继续按空格游戏。`);
      return;
    }
    requestAnimationFrame(time => infer(time, token));
  }

  $('camera-start').onclick = startCamera;
  $('camera-stop').onclick = () => stopCamera();
  $('calibrate').onclick = () => detector.reset();
  $('sensitivity').oninput = () => detector.reset();
  document.addEventListener('visibilitychange', () => { detector.reset(); previousVideoTime = -1; });
  window.addEventListener('pagehide', () => stopCamera());

}
main().catch(error => { document.getElementById("status").textContent = `游戏加载失败：${error.message}`; });
