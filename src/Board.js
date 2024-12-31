import cn from "classnames";
import React from "react";
import BackgroundPicker from "./BackgroundPicker";
import Button from "./Button";
import { useViewport } from "./util";
import { GUTTER_MD_PX } from "./util";
import styles from "./Board.module.scss";
import {
  swapTiles,
  generateSolved,
  generateRandom,
  getGoalPosition,
  solve,
  isGoal,
} from "./BoardUtil";

const ANIMATION_MS = 250;
const MAX_TILE_PX = 100;
const MIN_DIMENSION = 3;
const MAX_DIMENSION = 4;
const DEFAULT_DIMENSION = 4;

export default function Board() {
  const [dimension, setDimension] = React.useState(DEFAULT_DIMENSION);
  const [showNumbers, setShowNumbers] = React.useState(true);
  const [background, setBackground] = React.useState(null);

  let [board, setBoard] = React.useState(generateSolved(dimension));
  let [animation, setAnimation] = React.useState({
    animation: null,
    row: null,
    col: null,
  });

  // Các ref đảm bảo rằng callback hoạt động luôn với trạng thái mới nhất
  // https://reactjs.org/docs/hooks-faq.html#why-am-i-seeing-stale-props-or-state-inside-my-function

  const [isSolving, setSolving] = React.useState(false); // Để hiển thị chính xác trạng thái trên nút
  const isSolvingRef = React.useRef(isSolving); // Kiểm tra xem có thực sự chạy giải pháp không

  const [enableSound, setEnableSound] = React.useState(true);
  const enableSoundRef = React.useRef(enableSound);

  const boardRef = React.useRef(board);
  boardRef.current = board;

  // Tái tạo lại bảng khi thay đổi kích thước bảng
  React.useEffect(() => setBoard(generateSolved(dimension)), [dimension]);

  const isSolved = React.useMemo(() => isGoal(board.tiles), [board]);

  const sound = React.useMemo(() => {
    return document.getElementById("sound-tile");
  }, []);

  const moveTile = React.useCallback(
    (row, col) => {
      const { blankRow, blankCol } = boardRef.current;

      let animation;
      if (row - 1 === blankRow) animation = styles.slideUp;
      else if (row + 1 === blankRow) animation = styles.slideDown;
      else if (col - 1 === blankCol) animation = styles.slideLeft;
      else animation = styles.slideRight;

      // Chạy animation
      setAnimation({ animation, row, col });

      // Phát âm thanh (trừ khi đang chạy giải pháp tự động)
      if (enableSoundRef.current && !isSolvingRef.current) {
        sound.currentTime = 0;
        sound.play();
      }

      // Sau khi ANIMATION_MS trôi qua, dọn dẹp
      return new Promise((resolve) => {
        setTimeout(() => {
          // Dừng animation
          setAnimation({ animation: null, row: null, col: null });

          // Cập nhật trạng thái
          swapTiles(
            boardRef.current.tiles,
            row,
            col,
            boardRef.current.blankRow,
            boardRef.current.blankCol
          );
          setBoard({
            tiles: boardRef.current.tiles,
            blankRow: row,
            blankCol: col,
          });

          resolve();
        }, ANIMATION_MS);
      });
    },
    [boardRef, sound, enableSoundRef]
  );

  const onClickTile = React.useCallback(
    (row, col) => {
      // Bỏ qua click khi đang có animation hoặc giải pháp tự động đang chạy
      if (animation.animation || isSolvingRef.current) return Promise.resolve();

      // Bỏ qua click trên các ô không nằm cạnh ô trống
      const { blankRow, blankCol } = boardRef.current;
      const isValidMove =
        (blankRow === row && Math.abs(blankCol - col) === 1) ||
        (blankCol === col && Math.abs(blankRow - row) === 1);
      if (!isValidMove) return Promise.resolve();

      return moveTile(row, col);
    },
    [animation, isSolvingRef, boardRef, moveTile]
  );

  const onClickShuffle = React.useCallback(() => {
    setBoard(generateRandom(dimension));
  }, [dimension]);

  const onClickStop = React.useCallback(() => {
    setSolving(false);
    isSolvingRef.current = false;
  }, []);

  const onClickSolve = React.useCallback(() => {
    const solution = solve(board.tiles, board.blankRow, board.blankCol);

    setSolving(true);
    isSolvingRef.current = true;

    // Kết nối các bước giải quyết thành chuỗi các promise thực hiện lần lượt
    solution
      .reduce(
        (promise, nextStep) =>
          promise.then(() => {
            // Chạy bước giải pháp tiếp theo nếu "isSolving" vẫn là true.
            // Nếu không, hủy các bước tiếp theo.
            if (isSolvingRef.current)
              return moveTile(nextStep.blankRow, nextStep.blankCol);
            else return Promise.reject();
          }),
        Promise.resolve()
      )
      .catch(() => {
        /* bỏ qua lỗi từ nút Stop */
      })
      .then(() => {
        setSolving(false);
        isSolvingRef.current = false;
      });
  }, [isSolvingRef, board, moveTile]);

  // Phù hợp với kích thước nhỏ hơn (style "cover" cho background)
  const backgroundWidth = React.useMemo(() => {
    if (!background || background.width < background.height)
      return 100 * dimension;
    return 100 * (background.width / background.height) * dimension;
  }, [background, dimension]);
  const backgroundHeight = React.useMemo(() => {
    if (!background || background.height < background.width)
      return 100 * dimension;
    return 100 * (background.height / background.width) * dimension;
  }, [background, dimension]);

  const windowWidth = useViewport().width;
  const tileSize = React.useMemo(() => {
    // Trên các màn hình nhỏ, điều chỉnh kích thước ô để lấp đầy chiều rộng của cửa sổ trừ khoảng cách padding
    return Math.min(
      MAX_TILE_PX,
      (windowWidth - GUTTER_MD_PX * 2) / MAX_DIMENSION
    );
  }, [windowWidth]);

  // Tính toán độ lệch để căn giữa cho các background không phải vuông. Chuyển phần dư % thành pixel
  const horizontalOffset = React.useMemo(() => {
    if (!background || background.height > background.width) return 0;
    return (
      ((background.width / background.height - 1) / 2) * dimension * tileSize
    );
  }, [background, dimension, tileSize]);
  const verticalOffset = React.useMemo(() => {
    if (!background || background.width > background.height) return 0;
    return (
      ((background.height / background.width - 1) / 2) * dimension * tileSize
    );
  }, [background, dimension, tileSize]);

  return (
    <>
      <h1 className={styles.title}>Sliding Puzzle</h1>
      <div className={styles.wrapper}>
        <div className={styles.board}>
          {board.tiles.map((rowTiles, row) => (
            <div className={styles.row} key={row}>
              {rowTiles.map((tile, col) => {
                const goal = getGoalPosition(tile, dimension);

                // Sử dụng vị trí mục tiêu để tính toán background
                const backgroundPositionX = Math.ceil(
                  goal.col * -tileSize - horizontalOffset
                );
                const backgroundPositionY = Math.ceil(
                  goal.row * -tileSize - verticalOffset
                );

                return (
                  <div
                    className={cn([
                      styles.tile,
                      {
                        [styles.nonEmpty]: tile !== 0,
                        [animation.animation]:
                          animation.row === row && animation.col === col,
                      },
                    ])}
                    key={col}
                    onClick={() => onClickTile(row, col)}
                    style={
                      tile !== 0
                        ? {
                            width: tileSize,
                            height: tileSize,
                            backgroundImage:
                              background && `url("${background.url}")`,
                            backgroundSize: `${backgroundWidth}% ${backgroundHeight}%`,
                            backgroundPosition: `${backgroundPositionX}px ${backgroundPositionY}px`,
                          }
                        : {
                            width: tileSize,
                            height: tileSize,
                          }
                    }
                  >
                    {tile !== 0 && showNumbers && (
                      <div className={styles.number}>{tile}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className={styles.controls}>
          <div className={styles.controlMainRow}>
            <Button
              className={cn(styles.control, styles.main)}
              disabled={isSolving}
              onClick={onClickShuffle}
              type="button"
            >
              Shuffle
            </Button>
            <Button
              className={cn(styles.control, styles.main, {
                [styles.warning]: isSolving,
              })}
              disabled={isSolved}
              onClick={isSolving ? onClickStop : onClickSolve}
              type="button"
            >
              {isSolving ? "Stop" : "Solve"}
            </Button>
          </div>
          <div>
            <BackgroundPicker
              buttonClassName={styles.control}
              setBackground={setBackground}
            />
          </div>

          <div>
            <Button
              className={cn(styles.control, styles.setting)}
              disabled={isSolving}
              onClick={() => {
                if (dimension >= MAX_DIMENSION) setDimension(MIN_DIMENSION);
                else setDimension(dimension + 1);
              }}
            >
              {dimension >= MAX_DIMENSION ? <p>3x3</p> : <p>4x4</p>}
            </Button>
            <Button
              className={cn(styles.control, styles.setting, {
                [styles.warning]: !showNumbers,
              })}
              onClick={() => setShowNumbers(!showNumbers)}
            >
              {showNumbers ? <p>Hide Numbers</p> : <p>Show Numbers</p>}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
