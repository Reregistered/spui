import sourceMaps from 'rollup-plugin-sourcemaps';

export default {
    input: "es/tests/spec.js",
    output: {
        file: "dist/tests/spec.js",
        format: "umd"
    },
    sourcemap: true,
    plugins: [
        sourceMaps()
    ]
}