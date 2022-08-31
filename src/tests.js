import path from 'path';
import {
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
} from './lib.js';
import initPuppeteer from './puppeteer.js';

const runTests = async (projectPath, lang) => {
  const structureErrors = checkStructure(projectPath);

  if (structureErrors.length) {
    return structureErrors;
  }

  const { browser, page } = await initPuppeteer(path.join(projectPath, 'index.html'));

  const errors = (await Promise.all([
    checkW3C(path.join(projectPath, 'index.html')),
    checkCSS(projectPath),
    checkOrderStylesheetLinks(page, ['fonts.css', 'global.css', 'style.css']),
    checkAlternativeFonts(path.join(projectPath, 'styles', 'style.css'), ['Inter', 'EB Garamond']),
    checkSemanticTags(page, ['header', 'main', 'section', 'footer']),
    checkLang(page, lang),
    checkTitleEmmet(page),
    checkResetMargins(page, ['body']),
    checkLogoWrapper(page),
    checkPrefixForEmailAndPhone(page),
    checkLayout(page),
  ])).flat();

  await browser.close();

  return errors;
};

export default runTests;
