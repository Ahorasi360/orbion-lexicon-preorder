import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = '/home/ubuntu/orbion-lexicon-preorder';
const assetNames = await readdir(path.join(root, 'dist', 'public', 'assets'));
const bundle = [
  ['index.html', 'dist/public/index.html'],
  ...assetNames.map((assetName) => [`assets/${assetName}`, `dist/public/assets/${assetName}`]),
  ['vercel.json', 'vercel.json'],
];

const files = await Promise.all(bundle.map(async ([file, relativePath]) => ({
  file,
  data: await readFile(path.join(root, relativePath), 'utf8'),
  encoding: 'utf-8',
})));

const payload = {
  name: 'orbion-lexicon-preorder',
  target: 'production',
  teamId: 'team_b8gGhn7RY0zBwLVYIpbFIe8u',
  files,
};

await mkdir(path.join(root, '.deployment'), { recursive: true });
await writeFile(path.join(root, '.deployment', 'vercel-deploy.json'), JSON.stringify(payload));
