import typescript from "rollup-plugin-typescript";

export default {
  entry: "src/index.ts",
  dest: "build/bundle.js",
  format: "cjs",
  plugins: [
    typescript()
  ]
}
