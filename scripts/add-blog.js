const addContent = require('./add-content');

addContent({
  contentDir: './data/blogs/',
  indexFileName: 'blog-index.json',
  contentType: 'blog post',
  emoji: '✍️',
  gitPaths: ['data/blogs/'],
  titleField: 'title'
});