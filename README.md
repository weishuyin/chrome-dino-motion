# Dinosaur · 摄像头体感跑酷

## 本地运行

需要 Node.js 22 或更新版本。

```sh
cd ~/Downloads/chrome-dino-motion
npm ci
npm run dev
```

打开终端显示的地址，默认是 http://127.0.0.1:5173/ 。按 `Ctrl+C` 停止服务。

首次安装依赖时会自动准备 MediaPipe WASM 文件，识别模型已包含在项目中。

## 游戏操作

- **空格 / ↑**：开始、跳跃；游戏结束后重来。
- **↓**：蹲下。
- **体感跳跃**：点击“开启摄像头”并允许访问，让头部或肩膀入镜，站稳片刻完成校准，然后原地跳跃。
- **灵敏度与校准**：通过滑块调整灵敏度，点击“重新校准”重新准备识别。
- 摄像头和键盘可以同时使用；关闭摄像头后仍可通过键盘操作。
- 最高分保存在当前浏览器中。

## 构建与预览

```sh
npm run build
npm run preview
```

构建结果位于 `dist/`，预览地址默认为 http://127.0.0.1:4173/ 。修改源码后需重新构建。

## 发布

将 `dist/` 中的全部内容上传到静态网站托管服务，使 `index.html` 位于网站根目录。保留 `assets/`、`models/` 和 `vendor/` 的完整目录结构。

更新网站时，重新执行 `npm run build`，再上传新的构建结果。

### GitHub Pages 自动发布

项目已包含 GitHub Pages 部署工作流：

1. 将项目源码上传到自己的 GitHub 仓库，保留 `.github/` 目录，不上传 `node_modules/` 和 `dist/`。
2. 在仓库 `Settings → Pages → Source` 中选择 `GitHub Actions`。
3. 推送到 `main` 分支，或在 Actions 页面手动运行 `Deploy game`。
4. 部署成功后，从 Pages 设置或工作流结果打开网站地址。

如果使用其他默认分支，需要同步修改工作流中的分支配置。后续推送会自动构建并更新网站。
