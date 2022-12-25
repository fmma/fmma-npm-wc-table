import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";

export default {
    input: 'lib/example.js',
    output: {
        name: 'x',
        file: 'dist/index.js',
        format: 'iife',
        exports: 'named',
    },
    plugins: [commonjs(),nodeResolve()]
};