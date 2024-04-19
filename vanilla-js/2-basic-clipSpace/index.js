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

attribute vec2 a_position;

uniform vec2 u_resolution;

void main () {
  // 從像素座標轉換 0.0 到 1.0
  vec2 zeroToOne = a_position.xy / u_resolution;

  // 再把 0 -> 1 轉換到 0 -> 2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // 把 0 -> 2 轉換到 -1 -> 1 (剪裁空間)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

const fragmentShaderSource = /*glsl*/ `

  precision mediump float;

  void main() {
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

  // 尋找 u_resolution 屬性值位置
  const resolutionUniformLocation = gl.getUniformLocation(
    program, 'u_resolution'
  )
  // 屬性值從緩衝中獲取數據，所以我們創建一個緩衝
  const positionBuffer = gl.createBuffer();
  // WebGL可以通過綁定點 (gl.Array_Buffer) 操控全域範圍內的許多數據，你可以把綁定點想像成一個 WebGL 內部的全域變數。 首先綁定一個數據源到綁定點，然後可以引用綁定點指向該數據源。 所以讓我們來綁定位置信息緩衝（下面的綁定點就是 ARRAY_BUFFER ）
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // 現在我們需要通過綁定點向緩衝中存放數據
  const positions = [
    10, 20,
    80, 20,
    10, 30,
    10, 30,
    80, 20,
    80, 30
  ]; // 平面空間中三點

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

  // 設置全局變量 分辨率
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)

  var primitiveType = gl.TRIANGLES;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);
}

document.addEventListener('DOMContentLoaded', main);
