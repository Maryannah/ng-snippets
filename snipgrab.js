const { writeFile, mkdir } = require('fs/promises');
const { join } = require('path');

/** The path where you want your snippets to go */
const basePath = join(process.cwd(), 'projects', 'snippets');

const baseUrl = 'https://raw.githubusercontent.com/Maryannah/ng-snippets/master/projects/snippets/src/lib';

const [exec, script, ...files] = process.argv;

(async () => {
  try {
    for (const file of files) {
      const url = `${baseUrl}/${file}`;
      const filepath = join(basePath, ...file.split('/'));
      const crumbs = file.split('/');
      const filename = crumbs.pop();
      const folder = join(basePath, ...crumbs);

      const response = await fetch(url, { method: 'GET' });
      const content = await response.text();
      console.log(`${filename} fetched.`);

      await mkdir(folder, { recursive: true });
      await writeFile(filepath, content);
      console.log(`${filename} written to disk.`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
