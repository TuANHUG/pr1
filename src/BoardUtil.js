import PriQueue from "./PriQueueUtil"; // hàng đợi ưu tiên

// Hoán đổi hai ô trên bảng 2d
export function swapTiles(board, row1, col1, row2, col2) {
  const temp = board[row1][col1];
  board[row1][col1] = board[row2][col2];
  board[row2][col2] = temp;
}

//Tìm vị trí ô trống trên bảng 2d
function findBlank(board) {
  const dimension = board.length;
  for (let row = 0; row < dimension; row++) {
    for (let col = 0; col < dimension; col++) {
      if (board[row][col] === 0) return { row, col };
    }
  }
}

//Chuyển đổi chỉ số của 1d sang 2d
function indexToCoords(index, dimension) {
  return {
    row: Math.floor(index / dimension),
    col: index % dimension,
  };
}

// Tạo bảng đã giải
export function generateSolved(dimension) {
  let tiles = [];
  for (let row = 0; row < dimension; row++) {
    tiles[row] = [];
    for (let col = 0; col < dimension; col++) {
      tiles[row][col] = row * dimension + col + 1;
    }
  }
  tiles[dimension - 1][dimension - 1] = 0;
  return { tiles: tiles, blankRow: dimension - 1, blankCol: dimension - 1 };
}

// các hàm xử lý đảm bảo bài toán có thể giải được sau khi trộn
// số nghịch đảo là lượng cặp (i,j) i< j a[i] > a[j]
// Hợp nhất hai mảng đã sắp xếp array[left..mid] và array[mid+1..right] vào tempArray theo thứ tự tăng dần và đếm số nghịch đảo
function merge(array, tempArray, left, mid, right) {
  let inversions = 0;
  let i = left;
  let j = mid + 1;
  let k = left;
  // So sánh và hợp nhất
  while (i <= mid && j <= right) {
    if (array[i] <= array[j]) {
      tempArray[k] = array[i];
      k++;
      i++;
    } else {
      tempArray[k] = array[j];
      // Không tính ô trống
      if (array[j] !== 0) inversions += mid - i + 1; // phần tử thuộc mảng con phải nhỏ hơn toàn bộ phần tử từ i đến mid
      k++;
      j++;
    }
  }

  while (i <= mid) {
    tempArray[k] = array[i];
    k++;
    i++;
  }
  while (j <= right) {
    tempArray[k] = array[j];
    k++;
    j++;
  }

  for (let x = left; x <= right; x++) array[x] = tempArray[x];

  return inversions;
}

// Hàm MergeSort để đếm số nghịch đảo trong mảng
function mergeSort(array, tempArray, left, right) {
  let inversions = 0;

  if (left < right) {
    const mid = Math.floor((left + right) / 2);
    inversions += mergeSort(array, tempArray, left, mid);
    inversions += mergeSort(array, tempArray, mid + 1, right);
    inversions += merge(array, tempArray, left, mid, right);
  }

  return inversions;
}

// Đếm số nghịch đảo trong mảng
export function countInversions(array) {
  return mergeSort(array, [], 0, array.length - 1);
}

// Kiểm tra bảng có thể giải được hay không
export function isSolvable(tiles, blankRow) {
  const dimension = tiles.length;
  const flattenedBoard = [].concat(...tiles); // 2d to 1d
  const inversions = countInversions(flattenedBoard);
  if (dimension % 2 === 1) return inversions % 2 === 0;
  else if (blankRow % 2 === 0) return inversions % 2 === 1;
  return inversions % 2 === 0;
}

// Trộn các ô của bảng theo thứ tự ngẫu nhiên và đảm bảo bảng có thể giải được
function shuffleBoard(tiles) {
  const dimension = tiles.length;
  const size = dimension * dimension - 1;

  // Thuật toán Fisher-Yates để trộn ngẫu nhiên các ô
  for (let i = size; i > 0; i--) {
    const j = Math.floor(Math.random() * i); // j thuộc từ 0 đến i-1
    const iCoords = indexToCoords(i, dimension);
    const jCoords = indexToCoords(j, dimension);
    swapTiles(tiles, iCoords.row, iCoords.col, jCoords.row, jCoords.col); // đổi chỗ ô i và ô j
  }

  const blankPos = findBlank(tiles);
  if (!isSolvable(tiles, blankPos.row)) {
    // Nếu bảng không thể giải, tăng/giảm số nghịch đảo 1đv để đảm bảo solvable
    if (blankPos.row === 0)
      swapTiles(tiles, 1, 0, 1, 1); // đảm bảo ko hoán vị ô trống
    else swapTiles(tiles, 0, 0, 0, 1);
  }

  return { tiles: tiles, blankRow: blankPos.row, blankCol: blankPos.col };
}

//Lấy vị trí mục tiêu của một ô trong bảng
export function getGoalPosition(tile, dimension) {
  return indexToCoords(tile - 1, dimension);
}

//Tính tổng khoảng cách Manhattan từ các ô đến vị trí mục tiêu của chúng
export function manhattan(tiles) {
  const dim = tiles.length;
  let distance = 0;
  for (let row = 0; row < dim; row++) {
    // duyệt toàn bộ các ô
    for (let col = 0; col < dim; col++) {
      const tile = tiles[row][col];
      if (tile === 0) continue;
      const goal = getGoalPosition(tile, dim);
      distance += Math.abs(goal.row - row) + Math.abs(goal.col - col); // công thức tính khoảng cách manhattan
    }
  }
  return distance;
}

//Kiểm tra bảng hiện tại có đạt trạng thái mục tiêu
export function isGoal(tiles) {
  return manhattan(tiles) === 0;
}

// Tính số lượng xung đột tuyến tính(2 ô cùng nằm trong hàng/cột và vị trí mục tiêu cũng cùng hàng/cột nhưng vị trí của chúng cản trở lẫn nhau)
export function linearConflict(tiles) {
  const dim = tiles.length;

  let linearConflicts = 0;

  for (let row = 0; row < dim; row++) {
    // duyệt qua các hàng để kiểm tra
    for (let col1 = 0; col1 < dim; col1++) {
      // duyệt toàn bộ các cặp ô trong hàng
      for (let col2 = col1; col2 < dim; col2++) {
        const tile1 = tiles[row][col1];
        const tile2 = tiles[row][col2];
        if (tile1 === 0 || tile2 === 0) continue; // bỏ ô trống
        const goal1 = getGoalPosition(tile1, dim);
        const goal2 = getGoalPosition(tile2, dim);
        if (goal1.row === row && goal2.row === row && goal1.col > goal2.col)
          //thứ tự 2 ô gây cản trở
          linearConflicts++;
      }
    }
  }

  for (let col = 0; col < dim; col++) {
    // tương tự với cột
    for (let row1 = 0; row1 < dim; row1++) {
      for (let row2 = row1; row2 < dim; row2++) {
        const tile1 = tiles[row1][col];
        const tile2 = tiles[row2][col];
        if (tile1 === 0 || tile2 === 0) continue;
        const goal1 = getGoalPosition(tile1, dim);
        const goal2 = getGoalPosition(tile2, dim);
        if (goal1.col === col && goal2.col === col && goal1.row > goal2.row)
          linearConflicts++;
      }
    }
  }

  return linearConflicts;
}

// Hàm heuristic kết hợp Manhattan và xung đột tuyến tính
export function heuristic(tiles) {
  return manhattan(tiles) + 2 * linearConflict(tiles);
}

// So sánh hai bảng
export function deepEqual(tiles1, tiles2) {
  if (tiles1.length !== tiles2.length) return false;
  for (let row = 0; row < tiles1.length; row++) {
    for (let col = 0; col < tiles1.length; col++) {
      if (tiles1[row][col] !== tiles2[row][col]) return false;
    }
  }
  return true;
}

// Tạo một bảng hàng xóm
function createNeighbor(tiles, blankRow, blankCol, neighborRow, neighborCol) {
  swapTiles(tiles, blankRow, blankCol, neighborRow, neighborCol); // hoán vị ô trống
  const neighbor = JSON.parse(JSON.stringify(tiles)); // tạo bản sao hàng xóm là 1 hoán vị
  swapTiles(tiles, blankRow, blankCol, neighborRow, neighborCol); // đưa bảng về trạng thái cũ
  return { tiles: neighbor, blankRow: neighborRow, blankCol: neighborCol };
}

//Tạo các bảng hàng xóm bằng cách di chuyển ô trống lên xuống trái phải
export function neighbors(tiles, blankRow, blankCol) {
  let neighbors = [];

  if (blankRow > 0) {
    neighbors.push(
      createNeighbor(tiles, blankRow, blankCol, blankRow - 1, blankCol)
    );
  }
  if (blankCol > 0) {
    neighbors.push(
      createNeighbor(tiles, blankRow, blankCol, blankRow, blankCol - 1)
    );
  }
  if (blankRow < tiles.length - 1) {
    neighbors.push(
      createNeighbor(tiles, blankRow, blankCol, blankRow + 1, blankCol)
    );
  }
  if (blankCol < tiles.length - 1) {
    neighbors.push(
      createNeighbor(tiles, blankRow, blankCol, blankRow, blankCol + 1)
    );
  }

  return neighbors;
}

//Sinh bảng ngẫu nhiên có thể giải được
export function generateRandom(dimension) {
  return shuffleBoard(generateSolved(dimension).tiles);
}

// Hàm so sánh hai nút trong hàng đợi ưu tiên
function compare(n1, n2) {
  const priority1 = n1.heuristic * 2 + n1.steps;
  const priority2 = n2.heuristic * 2 + n2.steps;
  return priority1 - priority2;
}

//  thuật toán  A*
export function solve(tiles, blankRow, blankCol) {
  const initial = {
    tiles,
    blankRow,
    blankCol,
    heuristic: heuristic(tiles),
    steps: 0,
    previous: null,
  };
  const queue = new PriQueue([initial], compare); // thêm trạng thái ban đầu vào hàng đợi ưu tiên
  let searchNode = initial;
  let totalProcess = 0;
  while (!isGoal(searchNode.tiles)) {
    // chưa đạt trạng thái giải
    searchNode = queue.pop(); // lấy trạng thái tốt nhất từ hàng đợi ưu tiên dựa trên heuristic + steps
    totalProcess++;

    const neighborList = neighbors(
      // tạo các trạng thái liền kề
      searchNode.tiles,
      searchNode.blankRow,
      searchNode.blankCol
    );
    for (let i = 0; i < neighborList.length; i++) {
      // đẩy các trạng thái liền kề vào hàng đợi ưu tiên
      const nextNeighbor = neighborList[i];

      // Bỏ qua nếu bảng giống bảng trước đó
      if (
        searchNode.previous !== null &&
        deepEqual(nextNeighbor.tiles, searchNode.previous.tiles)
      ) {
        continue; // tránh lặp lại vị trí đã có trước đó
      }

      queue.push({
        tiles: nextNeighbor.tiles,
        blankRow: nextNeighbor.blankRow,
        blankCol: nextNeighbor.blankCol,
        heuristic: heuristic(nextNeighbor.tiles),
        steps: searchNode.steps + 1,
        previous: searchNode,
      });
    }
  }
  let totalSteps = searchNode.steps;
  console.log("Solution Steps By A*:", totalSteps);
  console.log("Solution Process By A*:", totalProcess);

  // Lưu chuỗi bước di chuyển
  const solution = [];
  while (searchNode !== null) {
    solution.push({
      blankRow: searchNode.blankRow,
      blankCol: searchNode.blankCol,
    });
    searchNode = searchNode.previous;
  }

  solution.reverse(); // đảo ngược để mảng lưu từ trạng thái nguồn đến trạng thái đích
  solution.shift(); // bỏ trạng thái đầu tiên
  return solution;
}

export function solveVisitedSet(tiles, blankRow, blankCol) {
  const initial = {
    tiles,
    blankRow,
    blankCol,
    heuristic: heuristic(tiles),
    steps: 0,
    previous: null,
  };
  const queue = new PriQueue([initial], compare); // thêm trạng thái ban đầu vào hàng đợi ưu tiên
  const visited = new Set();
  let searchNode = initial;
  let totalProcess = 0;
  while (!isGoal(searchNode.tiles)) {
    // chưa đạt trạng thái giải
    searchNode = queue.pop(); // lấy trạng thái tốt nhất từ hàng đợi ưu tiên dựa trên heuristic + steps
    totalProcess++;
    const stateKey = JSON.stringify(searchNode.tiles);
    if (visited.has(stateKey)) continue; // Bỏ qua nếu trạng thái đã xử lý
    visited.add(stateKey); // Đánh dấu trạng thái đã xử lý

    const neighborList = neighbors(
      // tạo các trạng thái liền kề
      searchNode.tiles,
      searchNode.blankRow,
      searchNode.blankCol
    );
    for (let i = 0; i < neighborList.length; i++) {
      // đẩy các trạng thái liền kề vào hàng đợi ưu tiên
      const nextNeighbor = neighborList[i];
      // Bỏ qua nếu trạng thái đã được xử lý
      const neighborKey = JSON.stringify(nextNeighbor.tiles);
      if (visited.has(neighborKey)) continue;

      // Bỏ qua nếu bảng giống bảng trước đó

      queue.push({
        tiles: nextNeighbor.tiles,
        blankRow: nextNeighbor.blankRow,
        blankCol: nextNeighbor.blankCol,
        heuristic: heuristic(nextNeighbor.tiles),
        steps: searchNode.steps + 1,
        previous: searchNode,
      });
    }
  }
  let totalSteps = searchNode.steps;
  console.log("Solution Steps By A* with visited set:", totalSteps);
  console.log("Solution Process By A* with visited set:", totalProcess);
  
  // Lưu chuỗi bước di chuyển
  const solution = [];
  while (searchNode !== null) {
    solution.push({
      blankRow: searchNode.blankRow,
      blankCol: searchNode.blankCol,
    });
    searchNode = searchNode.previous;
  }

  solution.reverse(); // đảo ngược để mảng lưu từ trạng thái nguồn đến trạng thái đích
  solution.shift(); // bỏ trạng thái đầu tiên
  return { solution, totalSteps };
}


