const addContent = require('./add-content');

addContent({
  contentDir: './data/photography/',
  indexFileName: 'pic-index.json',
  contentType: 'photo',
  emoji: '📸',
  gitPaths: ['data/photography/', 'assets/images/'],
  titleField: 'title'
});