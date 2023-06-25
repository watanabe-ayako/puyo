// 起動時に呼ばれる関数の登録
window.addEventListener("load", () => {
  initialize();
  // ゲームを開始する
  loop();
});

let mode; // 現在の状況
let frame; // 現在のフレーム(60分の1秒ごとに1追加)
let combinationCount = 0; // 連鎖の数

function initialize() {
  PuyoImage.initialize();  // 画像を準備する
  Stage.initialize();      // ステージを準備する
  Player.initialize();     // ユーザー操作の準備をする
  Score.initialize();      // シーンを初期状態にセットする
  mode = 'start';          // スコア表示の準備をする
  frame = 0;               // フレームを初期化する
}

function loop() {
    switch(mode) {
      case 'start':
        mode = 'checkFall'; //  空中にあるかも
        break;
      case 'checkFall':
        if(Stage.checkFall()) { // 落ちるかどうか判定
          mode = 'fall'
        } else {
          mode = 'checkErase'; // 落ちないなら消せるか判定
        }
        break;
    case 'fall':
      if(!Stage.fall()) {
        mode = 'checkErase'; // 落ち切ったら消せるか判定
      }
      break;
    case 'checkErase':
      // 消せるか判定
      const eraseInfo = Stage.checkErase(frame);
      if(eraseInfo) {
        mode = 'erasing';
        combinationCount++;
        // 得点計算
        Score.calculateScore(combinationCount, eraseInfo.piece, eraseInfo.color);
        Stage.hideZenkeshi();
      } else {
        if(Stage.puyoCount === 0 && combinationCount > 0) {
          // 全消し処理
          Stage.showZenkeshi();
          Score.addScore(3600);
        }
        combinationCount = 0;
        // 消せなかったら新しいぷよ登場
        mode = 'newPuyo'
      }
      break;
    case 'erasing':
      if(!Stage.erasing(frame)) {
        mode = 'checkFall'; // 消したら再度落ちるか判定
      }
      break;
    case 'newPuyo':
      if(!Player.createNewPuyo()) {
        mode = 'gameOver'; // 新しいぷよを作成できなかったらゲームオーバー
      } else {
        mode = 'playing'; // プレイヤー操作可能
      }
      break;
    case 'playing':
      const action = Player.playing(frame);
      mode = action; // 'playing' 'moving' 'rotating' 'fix' のどれかが返る
      break;
    case 'moving':
      if(!Player.moving(frame)) {
        mode = 'playing'; // 移動が終わったら操作可能
      }
      break;
    case 'rotating':
      if(!Player.rotating(frame)) {
        mode = 'playing'; // 回転が終わったら操作可能
      }
      break;
    case 'fix':
      Player.fix(); // 現在の位置でぷよを固定
      mode = 'checkFall' // 固定したら自由落下を確認
      break;
    case 'gameOver':
      PuyoImage.prepareBatankyu(frame); // ばたんきゅーの準備
      mode = 'batankyu';
      break;
    case 'batankyu':
      PuyoImage.batankyu(frame);
      Player.batankyu();
      break;
  }
  frame++;
  requestAnimationFrame(loop); // 60分の1秒後にもう一度呼び出す
}
