// Draws every particle in one gl.POINTS call. Canvas 2D needed a fillStyle
// string per particle to animate colour, which cost more than the physics;
// here the whole swarm is one buffer upload per frame.

export const FLOATS_PER_POINT = 7; // x, y, r, g, b, a, size

const VERTEX = `
attribute vec2 a_pos;
attribute vec4 a_col;
attribute float a_size;
uniform vec2 u_res;
uniform float u_dpr;
varying vec4 v_col;
varying float v_size;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_size = max(a_size * u_dpr, 1.0);
  gl_PointSize = v_size;
  v_col = a_col;
}`;

// An antialiased disc: full inside, a 1px ramp at the rim, measured in device
// pixels. A fade proportional to the radius left the 2-3px dust and grid dots
// as almost nothing but fade, so they barely showed. Premultiplied so both
// blend modes below stay correct.
const FRAGMENT = `
precision mediump float;
varying vec4 v_col;
varying float v_size;
void main() {
  float dist = length(gl_PointCoord - 0.5) * v_size;
  float a = clamp(0.5 * v_size - dist + 0.5, 0.0, 1.0) * v_col.a;
  if (a < 0.004) discard;
  gl_FragColor = vec4(v_col.rgb * a, a);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("swarm: could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`swarm: shader failed — ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

/** Everything that lives on the GPU. A lost context takes all of it, so it
 * is built again from scratch when the context comes back. */
function setup(gl: WebGLRenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error("swarm: could not create a program");
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`swarm: link failed — ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const stride = FLOATS_PER_POINT * 4;
  const attributes: [string, number, number][] = [
    ["a_pos", 2, 0],
    ["a_col", 4, 2],
    ["a_size", 1, 6],
  ];
  for (const [name, size, offset] of attributes) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * 4);
  }

  gl.enable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  return {
    program,
    buffer,
    uRes: gl.getUniformLocation(program, "u_res"),
    uDpr: gl.getUniformLocation(program, "u_dpr"),
  };
}

export type Renderer = {
  resize: (width: number, height: number, dpr: number) => void;
  draw: (data: Float32Array, count: number, additive: boolean) => void;
  destroy: () => void;
};

/** `onLost` / `onRestored` hear about the GPU taking the context away (a
 * driver reset, too many WebGL pages open) and giving it back. */
export function createRenderer(
  canvas: HTMLCanvasElement,
  { onLost, onRestored }: { onLost: () => void; onRestored: () => void }
): Renderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) return null;

  let gpu: ReturnType<typeof setup> | null = setup(gl);
  let size = { width: 1, height: 1, dpr: 1 };

  const applySize = () => {
    if (!gpu) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(gpu.uRes, size.width, size.height);
    gl.uniform1f(gpu.uDpr, size.dpr);
  };

  const lost = (event: Event) => {
    // Without preventDefault the browser never gives the context back.
    event.preventDefault();
    gpu = null;
    onLost();
  };
  const restored = () => {
    try {
      gpu = setup(gl);
    } catch (error) {
      console.error("swarm: could not rebuild after the WebGL context came back", error);
      return;
    }
    applySize();
    onRestored();
  };
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);

  return {
    resize(width, height, dpr) {
      size = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      applySize();
    },
    draw(data, count, additive) {
      if (!gpu) return;
      // Additive glow reads as light on the dark theme; on white it washes the
      // dots out, so the light theme gets ordinary "over" blending.
      if (additive) gl.blendFunc(gl.ONE, gl.ONE);
      else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, count * FLOATS_PER_POINT), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.POINTS, 0, count);
    },
    destroy() {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      if (gpu) {
        gl.deleteBuffer(gpu.buffer);
        gl.deleteProgram(gpu.program);
      }
    },
  };
}
