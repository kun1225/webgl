const canvas = document.querySelector('#c');

const gl = canvas.getContext('webgl');

if (!gl) {
  alert('WebGL not supported');
  throw new Error('WebGL not supported');
}

function resize(canvas) {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  if (canvas.width != displayWidth || canvas.height != displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

const vertexShaderSource = /*glsl*/ `

// 從 buffer 中獲取數據
attribute vec4 a_position;
// vec4 是一個有四個浮點資料的資料型態。在 JavaScrip 中你可以把它想像成 a_position = {x: 0, y: 0, z: 0, w: 0}。我們設定的 size = 2， 屬性預設值是0, 0, 0, 1，然後屬性將會從緩衝中取得前兩個值（ x 和 y ）。 z 和 w 還是預設值 0 和 1 。

// 所有著色器都有一個 main 方法
void main() {
  gl_Position = a_position;
}
`;

const fragmentShaderSource = /*glsl*/ `

  // 片段著色器沒有預設精度，所以需要設置一個精度
  // medium Precision 代表中等精度
  precision mediump float;

  void main() {
    // gl_FragColor 是片段着色器主要設置的變量
    // 上方我們設置 gl_FragColor 為 1, 0, 0.5, 1 ，其中 1 代表紅色值，0 代表綠色值， 0.5 代表藍色值，最後一個 1 表示阿爾法通道值。 WebGL 中的顏色值範圍從 0 到 1 。
    gl_FragColor = vec4(1,0,0.5,1); 
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type); // 創建著色器物件
  gl.shaderSource(shader, source); // 提供數據源
  gl.compileShader(shader); // 編譯 -> 生成著色器

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function main() {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = createProgram(gl, vertexShader, fragmentShader);

  // 尋找屬性值位置（和全域屬性位置）應該在初始化的時候完成，而不是在渲染迴圈中。
  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
  // 屬性值從緩衝中獲取數據，所以我們創建一個緩衝
  const positionBuffer = gl.createBuffer();
  // WebGL可以通過綁定點 (gl.Array_Buffer) 操控全域範圍內的許多數據，你可以把綁定點想像成一個 WebGL 內部的全域變數。 首先綁定一個數據源到綁定點，然後可以引用綁定點指向該數據源。 所以讓我們來綁定位置信息緩衝（下面的綁定點就是 ARRAY_BUFFER ）
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // 現在我們需要通過綁定點向緩衝中存放數據
  const positions = [0, 0, 0, 0.75, 0.7, 0]; // 平面空間中三點
  /*
  400 x 300
  0   ,0      ->  200, 150
  0   ,0.5    ->  200, 300
  0.7 ,0      ->  300, 150
  */
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW); //WebGL需要強類型數據，所以我們用 Float32Array
  // gl.STATIC_DRAW 是提示WebGL我們將怎麼使用這些數據。 WebGL會根據提示做出一些優化。

  // 在此之上的代碼是 初始化代碼。 這些代碼在頁面載入時只會運行一次。 接下來的代碼是渲染代碼，而這些代碼將在我們每次要渲染或者繪製時執行。

  resize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  // 接下來我們需要告訴WebGL怎麼從我們之前準備的緩衝中獲取數據給著色器中的屬性。 首先我們需要啟用對應屬性
  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const size = 2; // 每次迭代運行提取兩個單位數據
  const type = gl.FLOAT; // 每個單位的數據類型是 32 位浮點數
  const normalize = false; // 不需要將數據正規化
  const stride = 0; // 移動單位數量 * 每個單位占用內存
  const offset = 0; // 從緩衝起始位置開始讀取

  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  var primitiveType = gl.TRIANGLES; // 圖元類型：三角形
  var count = 3; // 運行三次
  // 第一次運行將會從位置緩衝中讀取前兩個值賦給屬性值 a_position.x 和 a_position.y。第二次運行 a_position.x 和 a_position.y 將會被賦予後兩個值，最後一次運行將被賦予最後兩個值。
  gl.drawArrays(primitiveType, offset, count);
}

document.addEventListener('DOMContentLoaded', main);
