import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { request } from 'undici';
import stylelint from 'stylelint';
import dirTree from 'directory-tree';
import {
  mkfile,
  mkdir,
  isDirectory,
} from '@hexlet/immutable-fs-trees';
import * as csstree from 'css-tree';
import compareImages from 'resemblejs/compareImages.js';
import { getFileData } from './utils.js';
import {
  hasElementBySelectors,
  getStyle,
} from './puppeteer.js';
import stylelintConfig from './config/stylelint.config.js';

const checkStructure = (projectPath) => {
  const projectTree = dirTree(projectPath, { attributes: ['type'] });
  const tree = mkdir('project', [
    mkfile('index.html'),
    mkdir('styles', [
      mkfile('style.css'),
    ]),
    mkdir('fonts', [
      mkfile('fonts.css'),
    ]),
  ]);

  const search = (canonicalTree, actualTree) => {
    const errors = canonicalTree.reduce((acc, item) => {
      const found = actualTree.find(({ name, type }) => item.name === name && item.type === type);
      if (!found) {
        return [...acc, {
          id: `structure.${item.type}`,
          values: {
            name: item.name,
          },
        }];
      }

      if (isDirectory(item) && found) {
        return [...acc, ...search(item.children, found.children)];
      }

      return acc;
    }, []);

    return errors;
  };

  return search(tree.children, projectTree.children);
};

const checkW3C = async (htmlPath) => {
  const html = getFileData(htmlPath);
  const fileName = path.basename(htmlPath);
  const { body } = await request('https://validator.w3.org/nu/?out=json', {
    body: html,
    method: 'POST',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'user-agent': 'Mozilla/5.0 (platform; rv:geckoversion) Gecko/geckotrail Firefox/firefoxversion',
    },
  });
  const response = await body.json();
  const errors = response.messages.filter((item) => item.type === 'error').map((item) => ({
    id: 'w3c',
    values: {
      fileName,
      line: item.lastLine,
      message: item.message,
    },
  }));

  return errors;
};

const checkCSS = async (cssPath) => {
  const response = await stylelint.lint({
    config: stylelintConfig,
    files: `${cssPath.split(path.sep).join(path.posix.sep)}**/*.css`, // заменить на `${cssPath}**/*.css`
  });

  const errors = response.results.reduce((errorsAcc, result) => {
    const fileName = path.basename(result.source);
    const errorsInFile = result.warnings.map((warning) => ({
      id: `stylelint.${warning.rule}`,
      values: {
        fileName,
        line: warning.line,
        column: warning.column,
        text: warning.text,
      },
    }));

    return errorsAcc.concat(errorsInFile);
  }, []);

  return errors;
};

const checkOrderStylesheetLinks = async (page, files) => {
  const selectors = files.map((file) => `link[href*="${file}"]`).join(' ~ ');
  const isCorrect = await hasElementBySelectors(page, selectors);

  if (!isCorrect) {
    return [{
      id: 'orderStylesheetLinks',
    }];
  }

  return [];
};

const checkAlternativeFonts = (cssPath, fonts) => {
  const errors = [];
  const cssCode = getFileData(cssPath);
  const ast = csstree.parse(cssCode);

  const fontsDeclarations = csstree.findAll(ast, (node) => node.type === 'Declaration' && node.property === 'font-family');
  const fontsProperties = fontsDeclarations.map((decl) => csstree.generate(decl));
  const alternativeFonts = fontsProperties.filter((property) => (
    !fonts.some((font) => property.includes(font))
  ));

  if (alternativeFonts.length) {
    errors.push({
      id: 'alternativeFonts',
      values: {
        fonts: fonts.join(', '),
      },
    });
  }

  return errors;
};

const checkSemanticTags = async (page, tags) => {
  const tagsAfterSearch = await Promise.all(tags.map(async (tagName) => {
    const isFound = await hasElementBySelectors(page, tagName);

    return {
      tagName,
      isMissing: !isFound,
    };
  }));
  const missingTags = tagsAfterSearch.filter(({ isMissing }) => isMissing);
  const missingTagNames = missingTags.map(({ tagName }) => tagName);

  if (missingTagNames.length) {
    return [{
      id: 'semanticTagsMissing',
      values: {
        tagNames: missingTagNames.join(', '),
      },
    }];
  }

  return [];
};

const checkLang = async (page, lang) => {
  const isFound = await hasElementBySelectors(page, `html[lang*=${lang}]`);

  if (!isFound) {
    return [{
      id: 'langAttrMissing',
      values: {
        lang,
      },
    }];
  }

  return [];
};

const checkTitleEmmet = async (page) => {
  const text = 'Document';
  const title = await page.evaluate(() => document.title);

  if (title === text) {
    return [{
      id: 'titleEmmet',
    }];
  }

  return [];
};

const checkResetMargins = async (page, tags) => {
  const properties = ['margin', 'padding'];

  const elementsProperties = await Promise.all(tags.map(async (tagName) => {
    const elementProperties = await getStyle(page, tagName, properties);

    return {
      tagName,
      isNotReset: elementProperties.some((property) => property !== '0px'),
    };
  }));

  const notResetTags = elementsProperties.filter(({ isNotReset }) => isNotReset);
  const notResetTagNames = notResetTags.map(({ tagName }) => tagName);

  if (notResetTagNames.length) {
    return [{
      id: 'notResetMargins',
      values: {
        tagNames: notResetTagNames.join(', '),
      },
    }];
  }

  return [];
};

const checkLogoWrapper = async (page) => {
  const hasWrapper = await hasElementBySelectors(page, 'a img[src*="logo"]');

  if (!hasWrapper) {
    return [{
      id: 'logoWrapper',
    }];
  }

  return [];
};

const checkPrefixForEmailAndPhone = async (page) => {
  const hasPrefixForEmail = await hasElementBySelectors(page, 'a[href^="mailto"]');
  const hasPrefixForPhone = await hasElementBySelectors(page, 'a[href^="tel"]');

  if (!hasPrefixForEmail || !hasPrefixForPhone) {
    return [{
      id: 'prefixForEmailAndPhone',
    }];
  }

  return [];
};

const checkLayout = async (page) => {
  await page.screenshot({ path: 'layout.jpg', fullPage: true });

  const options = {
    output: {
      errorColor: {
        red: 255,
        green: 0,
        blue: 255,
      },
      errorType: 'movement',
      transparency: 0.3,
      largeImageThreshold: 0,
      useCrossOrigin: false,
      outputDiff: true,
    },
    scaleToSameSize: true,
    ignore: 'antialiasing',
  };

  const data = await compareImages(fs.readFileSync('./layout-canonical.jpg'), fs.readFileSync('./layout.jpg'), options);
  fs.writeFileSync('./output.jpg', data.getBuffer(true));

  if (data.misMatchPercentage > 10) {
    return [{
      id: 'layoutDifferent',
    }];
  }

  return [];
};

export {
  checkStructure,
  checkW3C,
  checkCSS,
  checkOrderStylesheetLinks,
  checkAlternativeFonts,
  checkSemanticTags,
  checkLang,
  checkTitleEmmet,
  checkResetMargins,
  checkLogoWrapper,
  checkPrefixForEmailAndPhone,
  checkLayout,
};
