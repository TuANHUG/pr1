export default class PriQueue {
  /**
   * Khởi tạo một đối tượng hàng đợi ưu tiên.
   * @param {Array} data - Mảng dữ liệu ban đầu (mặc định là mảng rỗng).
   * @param {Function} compare - Hàm so sánh (mặc định là so sánh tăng dần).
   */
  constructor(data = [], compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)) {
    this.data = data;
    this.length = this.data.length; // Số lượng phần tử hiện có trong hàng đợi.
    this.compare = compare;

    // Nếu mảng ban đầu không rỗng, tiến hành min-heapify từ phần tử cha cuối cùng lên gốc.
    if (this.length > 0) {
      for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
    }
  }

  /**
   * Thêm một phần tử vào hàng đợi.
   * @param {*} item - Phần tử cần thêm vào.
   */
  push(item) {
    this.data.push(item); // Thêm phần tử mới vào cuối mảng.
    this._up(this.length++); // Sắp xếp lại heap bằng cách đẩy phần tử lên.
  }

  /**
   * Lấy và xóa phần tử nhỏ nhất (đầu hàng đợi).
   * @returns {*} Phần tử nhỏ nhất, hoặc undefined nếu hàng đợi rỗng.
   */
  pop() {
    if (this.length === 0) return undefined;

    const top = this.data[0]; // Phần tử nhỏ nhất (gốc của heap).
    const bottom = this.data.pop(); // Phần tử cuối cùng của mảng.

    if (--this.length > 0) {
      this.data[0] = bottom; // Đưa phần tử cuối lên gốc.
      this._down(0); // Sắp xếp lại heap bằng cách đẩy phần tử xuống.
    }

    return top; // Trả về phần tử nhỏ nhất.
  }

  /**
   * Lấy phần tử nhỏ nhất mà không xóa nó khỏi hàng đợi.
   * @returns {*} Phần tử nhỏ nhất, hoặc undefined nếu hàng đợi rỗng.
   */
  peek() {
    return this.data[0];
  }

  /**
   * Sắp xếp lại heap bằng cách đẩy phần tử lên trên.
   * @param {number} pos - Vị trí của phần tử cần đẩy lên.
   */
  _up(pos) {
    const { data, compare } = this;
    const item = data[pos];

    while (pos > 0) {
      const parent = (pos - 1) >> 1; // Chỉ số của phần tử cha.
      const current = data[parent];
      if (compare(item, current) >= 0) break; // Dừng nếu cha nhỏ hơn con.

      data[pos] = current; // Đổi chỗ với phần tử cha.
      pos = parent; // Tiếp tục kiểm tra ở vị trí cha.
    }

    data[pos] = item; // gán giá trị ban đầu cho lần đổi vị trí cuối cùng.
  }

  /**
   * min heapify bằng cách đẩy phần tử giá trị lớn hơn xuống dưới.
   * @param {number} pos - Vị trí của phần tử cần đẩy xuống.
   */
  _down(pos) {
    const { data, compare } = this;
    const halfLength = this.length >> 1; // Điểm dừng là nửa độ dài của mảng.
    const item = data[pos]; // lưu giá trị ở vị trí ban đầu

    while (pos < halfLength) {
      let bestChild = (pos << 1) + 1; // Ban đầu là con trái.
      const right = bestChild + 1;

      // Nếu có con phải và con phải nhỏ hơn con trái, chọn con phải.
      if (right < this.length && compare(data[right], data[bestChild]) < 0) {
        bestChild = right;
      }

      // Nếu phần tử con nhỏ hơn phần tử hiện tại, đổi chỗ.
      if (compare(data[bestChild], item) >= 0) break;

      data[pos] = data[bestChild]; // Đổi chỗ với phần tử con.
      pos = bestChild; // Tiếp tục kiểm tra ở vị trí con.
    }

    data[pos] = item; // gán giá trị ban đầu cho lần đổi vị trí cuối cùng.
  }
}
