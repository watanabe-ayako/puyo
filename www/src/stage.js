class Stage {
  // static stageElement;
  // static scoreElement;
  // static zenkeshiImage;
  // static board;
  // static puyoCount;
  // static fallingPuyoList;
  // static eraseStartFrame;
  // static erasingPuyoInfoList;

  static initialize() {
    // HTMLからステージの元となる要素を取得し大きさを設定
    const stageElement = document.getElementById("stage");
    stageElement.style.width = Config.puyoImgWidth * Config.stageCols + 'px';
    stageElement.style.height = Config.puyoImgHeight * Config.stageRows + 'px';
    stageElement.style.backgroundColor = Config.stageBackgroundColor;
    this.stageElement = stageElement;

    const zenkeshiImage = document.getElementById("zenkeshi");
    zenkeshiImage.width = Config.puyoImgWidth * 6;
    zenkeshiImage.style.position = 'absolute';
    zenkeshiImage.style.display = 'none';
    this.zenkeshiImage = zenkeshiImage;
    stageElement.appendChild(zenkeshiImage);

    const scoreElement = document.getElementById("score");
    scoreElement.style.backgroundColor = Config.scoreBackgroundColor;
    scoreElement.style.top = Config.puyoImgHeight * Config.stageRows + 'px';
    scoreElement.style.width = Config.puyoImgWidth * Config.stageCols + 'px';
    scoreElement.style.height = Config.fontHeight + "px";
    this.scoreElement = scoreElement;

    // メモリの準備
    this.board = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ];
    let puyoCount = 0;
    for(let y = 0; y < Config.stageRows; y++) {
      const line = this.board[y] || (this.board[y] = []);
      for(let x = 0; x < Config.stageCols; x++) {
        const puyo = line[x];
        if(puyo >= 1 && puyo <= 5) {
          // line[x] = {puyo: puyo, element: this.setPuyo(x, y, puyo)};
          this.setPuyo(x, y, puyo);
          puyoCount++;
        } else {
          line[x] = null;
        }
      }
    }
    this.puyoCount = puyoCount;
  }

  // 画面とメモリ両方にpuyoをセット
  static setPuyo(x, y, puyo) {
    // 画像を作成し配置
    const puyoImage = PuyoImage.getPuyo(puyo);
    puyoImage.style.left = x * Config.puyoImgWidth + "px";
    puyoImage.style.top = y * Config.puyoImgHeight + "px";
    this.stageElement.appendChild(puyoImage);
    // メモリにセット
    this.board[y][x] = {
      puyo: puyo,
      element: puyoImage,
    }
  }

  // 自由落下をチェック
  static checkFall() {
 this.fallingPuyoList.length = 0;
 let isFalling = false;
    // 下の行から上の行を見ていく
    for(let y = Config.stageRows - 2; y >= 0; y--) {
      const line = this.board[y];
      for(let x = 0; x < line.length; x++) {
        if(!this.board[y][x]) {
          // このマスにぷよがなければ次
          continue;
        }
        if(!this.board[y + 1][x]) {
          // このぷよは落ちるため取り除く
          let cell = this.board[y][x];
          this.board[y][x] = null;
          let dst = y;
          while(dst + 1 < Config.stageRows && this.board[dst + 1][x] == null) {
          dst++;
          }
          // 最終目的地に置く
          this.board[dst][x] = cell;
          // 落ちるリストに入れる
          this.fallingPuyoList.push({
            element: cell.element,
            position: y * Config.puyoImgHeight,
            destination: dst * Config.puyoImgHeight,
            falling: true
          });
          // 落ちるものがあったことを記録
          isFalling = true;
        }
      }
    }
    return isFalling;
  }
  // 自由落下させる
  static fall() {
    let isFalling = false;
    for(const fallingPuyo of this.fallingPuyoList) {
      if(!fallingPuyo.falling) {
      // 既に自由落下終わってる
        continue;
      }
      let position = fallingPuyo.position;
      position += Config.freeFallingSpeed;
      if(position >= fallingPuyo.destination) {
        // 自由落下おわり
        position = fallingPuyo.destination;
        fallingPuyo.falling = false;
      } else {
        // まだ落下しているぷよがあることを記録
        isFalling = true;
      }
      // 新しい位置を保存
      fallingPuyo.position = position;
      // ぷよを動かす
      fallingPuyo.element.style.top = position + 'px';
    }
    return isFalling;
  }

  // 消せるかどうか判定
  static checkErase(startFrame) {
    this.eraseStartFrame = startFrame;
    this.erasingPuyoInfoList.length = 0;

    // 何色のぷよを消したか記録
    const erasedPuyoColor = {};

    // 隣接ぷよを確認する関数内関数を作成
    const sequencePuyoInfoList = [];
    const existingPuyoInfoList = [];
    const checkSequentialPuyo = (x, y) => {
      // ぷよがあるか確認
      const orig = this.board[y][x];
      if(!orig) {
        // ないなら何もしない
        return;
      }
      // あったら一旦退避してメモリ上から消す
      const puyo = this.board[y][x].puyo;
      sequencePuyoInfoList.push({
        x: x,
        y: y,
        cell: this.board[y][x]
      });
      this.board[y][x] = null;

      // 四方向の周囲ぷよを確認
      const direction = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for(let i = 0; i < direction.length; i++) {
        const dx = x + direction[i][0];
        const dy = y + direction[i][1];
        if(dx < 0 || dy < 0 || dx >= Config.stageCols || dy >= Config.stageRows) {
          // ステージの外にはみ出た
          continue;
        }
        const cell = this.board[dy][dx];
        if(!cell || cell.puyo !== puyo) {
          // ぷよの色が違う
          continue;
        }
        // そのぷよのまわりのぷよも消せるか確認
        checkSequentialPuyo(dx, dy);
      };
    };

    // 実際に削除できるかの確認
    for(let y = 0; y < Config.stageRows; y++) {
      for(let x = 0; x < Config.stageCols; x++) {
        sequencePuyoInfoList.length = 0;
        const puyoColor = this.board[y][x] && this.board[y][x].puyo;
        checkSequentialPuyo(x, y);
        if(sequencePuyoInfoList.length == 0 || sequencePuyoInfoList.length < Config.erasePuyoCount) {
          // 連続して並んでいる数が足りいので消さない
          if(sequencePuyoInfoList.length) {
            // 退避していたぷよを消さないリストに追加
            existingPuyoInfoList.push(...sequencePuyoInfoList);
          }
        } else {
          // 消していいので消すリストに追加
          this.erasingPuyoInfoList.push(...sequencePuyoInfoList);
          erasedPuyoColor[puyoColor] = true;
        }
      }
    }
    this.puyoCount -= this.erasingPuyoInfoList.length;

    // 消さないリストに入っていたぷよをメモリに復帰
    for(const info of existingPuyoInfoList) {
      this.board[info.y][info.x] = info.cell;
    }

    if(this.erasingPuyoInfoList.length) {
      // もし消せるなら消えるぷよの個数と色情報をまとめて返す
      return {
        piece: this.erasingPuyoInfoList.length,
        color: Object.keys(erasedPuyoColor).length
      };
    }
    return null;
  }
  // 消すアニメーション
  static erasing(frame) {
    const elapsedFrame = frame - this.eraseStartFrame;
    const ratio = elapsedFrame / Config.eraseAnimationDuration;
    if(ratio > 1) {
      // アニメーションを終了
      for(const info of this.erasingPuyoInfoList) {
        var element = info.cell.element;
        this.stageElement.removeChild(element);
      }
      return false;
    } else if(ratio > 0.75) {
      for(const info of this.erasingPuyoInfoList) {
        var element = info.cell.element;
        element.style.display = 'block';
      }
      return true;
    } else if(ratio > 0.50) {
      for(const info of this.erasingPuyoInfoList) {
        var element = info.cell.element;
        element.style.display = 'none';
      }
      return true;
    } else if(ratio > 0.25) {
      for(const info of this.erasingPuyoInfoList) {
        var element = info.cell.element;
        element.style.display = 'block';
      }
      return true;
    } else {
      for(const info of this.erasingPuyoInfoList) {
        var element = info.cell.element;
        element.style.display = 'none';
      }
      return true;
    }
  }

  static showZenkeshi() {
    // 全消しを表示
    this.zenkeshiImage.style.display = 'block';
    this.zenkeshiImage.style.opacity = '1';
    const startTime = Date.now();
    const startTop = Config.puyoImgHeight * Config.stageRows;
    const endTop = Config.puyoImgHeight * Config.stageRows / 3;
    const animation = () => {
      const ratio = Math.min((Date.now() - startTime) / Config.zenkeshiDuration, 1);
      this.zenkeshiImage.style.opacity = String(1 - ratio);
      if(ratio !== 1) {
        requestAnimationFrame(animation);
      } else {
        this.zenkeshiImage.style.display = 'none';
      }
    };
    animation();
  }
  static hideZenkeshi() {
    // 全消しを消去
    const startTime = Date.now();
    const animation = () => {
      const ratio = Math.min((Date.now() - startTime) / Config.zenkeshiDuration, 1);
      this.zenkeshiImage.style.opacity = String(1 - ratio);
      if(ratio !== 1) {
        requestAnimationFrame(animation);
      } else {
        this.zenkeshiImage.style.display = 'none';
      }
    };
    animation();
  }
}
Stage.fallingPuyoList = [];
Stage.erasingPuyoInfoList = [];
