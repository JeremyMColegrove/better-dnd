import {defineConfig} from 'vite'
import {typescriptPaths} from 'rollup-plugin-typescript-paths'
import typescript from '@rollup/plugin-typescript'
import external from 'rollup-plugin-peer-deps-external'
// https://vitejs.dev/config/
export default defineConfig({
	//@ts-ignore
	plugins: [external()],
	external: ['react', 'react-dom'],
	build: {
		manifest: true,
		minify: true,
		reportCompressedSize: true,
		lib: {
			entry: './src/main.ts',
			fileName: 'main',
			formats: ['es', 'cjs'],
		},

		rollupOptions: {
			plugins: [typescriptPaths({preserveExtensions: true}), typescript({sourceMap: false, declaration: true, outDir: 'dist'})],
		},
	},
})
