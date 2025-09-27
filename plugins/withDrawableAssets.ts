import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync } from 'fs';
import { basename, join } from 'path';
import { withDangerousMod, type ConfigPlugin } from '@expo/config-plugins';

const androidFolderPath = ['app', 'src', 'main', 'res', 'drawable'];

const withDrawableAssets: ConfigPlugin<string | string[]> = (expoConfig, files) =>
  withDangerousMod(expoConfig, [
    'android',
    (modConfig) => {
      if (modConfig.modRequest.platform === 'android') {
        const androidDwarablePath = join(
          modConfig.modRequest.platformProjectRoot,
          ...androidFolderPath,
        );
        if (!Array.isArray(files)) {
          files = [files];
        }

        files.forEach((file) => {
          const isFile = lstatSync(file).isFile();
          if (isFile) {
            copyFileSync(file, join(androidDwarablePath, basename(file)));
          } else {
            copyFolderRecursiveSync(file, androidDwarablePath);
          }
        });
      }
      return modConfig;
    },
  ]);

async function copyFolderRecursiveSync(source: string, target: string) {
  if (!existsSync(target)) mkdirSync(target);

  const files = readdirSync(source);

  files.forEach(async (file) => {
    const sourcePath = join(source, file);
    const targetPath = join(target, file);

    if (lstatSync(sourcePath).isDirectory()) {
      copyFolderRecursiveSync(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  });
}

export default withDrawableAssets;
