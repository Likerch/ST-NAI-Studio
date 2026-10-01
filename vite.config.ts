import { defineConfig } from 'vite';

// Library build: a single ESM bundle that SillyTavern loads as <script type="module">.
// The bundle must not import anything from SillyTavern by path; it talks to the host through
// the global `SillyTavern.getContext()` / `SillyTavern.libs`.
export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: () => 'index.js',
            cssFileName: 'style',
        },
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        target: 'es2022',
    },
});
