const addContent = require('./add-content');

addContent({
  contentDir: './data/books/',
  indexFileName: 'books-index.json',
  contentType: 'book review',
  emoji: '📚',
  gitPaths: ['data/books/'],
  titleField: 'title'
});