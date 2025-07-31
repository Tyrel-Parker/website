const fs = require('fs');
const path = require('path');

function convertMarkdownToHTML(markdown) {
    let html = markdown;
    
    // First, handle code blocks and inline code to protect them
    const codeBlocks = [];
    const inlineCode = [];
    
    // Protect inline code
    html = html.replace(/`([^`]+)`/g, (match, code) => {
        inlineCode.push(`<code class="blog-code-inline">${code}</code>`);
        return `__INLINE_CODE_${inlineCode.length - 1}__`;
    });
    
    // Split into lines for better processing
    const lines = html.split('\n');
    const processedLines = [];
    let inList = false;
    let listType = '';
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Headers (must be at start of line)
        if (/^### /.test(line)) {
            line = line.replace(/^### (.*)$/, '<h3>$1</h3>');
        } else if (/^## /.test(line)) {
            line = line.replace(/^## (.*)$/, '<h2>$1</h2>');
        } else if (/^# /.test(line)) {
            line = line.replace(/^# (.*)$/, '<h1>$1</h1>');
        }
        // Blockquotes
        else if (/^> /.test(line)) {
            line = line.replace(/^> (.*)$/, '<blockquote class="blog-quote">$1</blockquote>');
        }
        // Lists
        else if (/^[\s]*[-*+]\s/.test(line)) {
            if (!inList || listType !== 'ul') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ul>');
                inList = true;
                listType = 'ul';
            }
            line = line.replace(/^[\s]*[-*+]\s(.*)$/, '<li>$1</li>');
        }
        else if (/^[\s]*\d+\.\s/.test(line)) {
            if (!inList || listType !== 'ol') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ol>');
                inList = true;
                listType = 'ol';
            }
            line = line.replace(/^[\s]*\d+\.\s(.*)$/, '<li>$1</li>');
        }
        // Close lists when we hit a non-list line
        else if (inList && line.trim() !== '') {
            processedLines.push(`</${listType}>`);
            inList = false;
            listType = '';
        }
        
        processedLines.push(line);
    }
    
    // Close any open list
    if (inList) {
        processedLines.push(`</${listType}>`);
    }
    
    html = processedLines.join('\n');
    
    // Bold and italic (after line processing)
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Convert double newlines to paragraph breaks, but protect existing HTML tags
    const paragraphs = html.split(/\n\s*\n/);
    const processedParagraphs = paragraphs.map(para => {
        para = para.trim();
        if (!para) return '';
        
        // Don't wrap if it's already an HTML block element
        if (/^<(h[1-6]|div|blockquote|ul|ol|li)[\s>]/.test(para) || /^<\/(h[1-6]|div|blockquote|ul|ol|li)>/.test(para)) {
            return para;
        }
        
        // Don't wrap if the entire paragraph is already wrapped in HTML
        if (/^<[^>]+>.*<\/[^>]+>$/.test(para)) {
            return para;
        }
        
        return `<p>${para}</p>`;
    });
    
    html = processedParagraphs.join('\n\n');
    
    // Restore inline code
    html = html.replace(/__INLINE_CODE_(\d+)__/g, (match, index) => {
        return inlineCode[parseInt(index)];
    });
    
    return html;
}

function parseContentFile(filePath, type = 'blog') {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let frontmatter = {};
    let contentStartIndex = 0;
    
    // Check if file starts with frontmatter
    if (lines[0] && lines[0].trim() === '---') {
        let frontmatterEnd = -1;
        
        // Find the closing ---
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                frontmatterEnd = i;
                break;
            }
            
            const line = lines[i].trim();
            
            // Skip empty lines and comments in frontmatter
            if (!line || line.startsWith('#')) continue;
            
            if (line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                let value = valueParts.join(':').trim();
                
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                // Handle arrays (tags)
                if (value.startsWith('[') && value.endsWith(']')) {
                    value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
                }
                
                // Handle numbers
                if (!isNaN(value) && value !== '' && !isNaN(parseFloat(value))) {
                    value = Number(value);
                }
                
                // Handle booleans
                if (value === 'true') value = true;
                if (value === 'false') value = false;
                
                frontmatter[key.trim()] = value;
            }
        }
        
        // If we found closing ---, content starts after it
        if (frontmatterEnd >= 0) {
            contentStartIndex = frontmatterEnd + 1;
        }
    }
    
    // Get all content (preserving everything including HTML, comments, etc.)
    const contentLines = lines.slice(contentStartIndex);
    const mainContent = contentLines.join('\n').trim();
    
    // Convert Markdown to HTML if the file is .md
    const finalContent = path.extname(filePath) === '.md' 
        ? convertMarkdownToHTML(mainContent)
        : mainContent;
    
    // Calculate word count (approximate, excluding HTML tags)
    const wordCount = calculateWordCount(finalContent);
    
    // Generate excerpt if not provided (first paragraph, ~150 chars)
    const excerpt = frontmatter.excerpt || generateExcerpt(finalContent);
    
    // Generate default values based on type
    const defaults = getDefaults(type, path.basename(filePath, path.extname(filePath)));
    
    // Merge frontmatter with defaults and add processed content
    const result = {
        ...defaults,
        ...frontmatter,
        wordCount: frontmatter.wordCount || wordCount,
        excerpt: excerpt
    };
    
    // Put content in - JSON.stringify will handle all escaping
    result.content = finalContent;
    
    return result;
}

function calculateWordCount(content) {
    // Remove HTML tags and count words
    const textOnly = content.replace(/<[^>]*>/g, ' ');
    const words = textOnly.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
}

function generateExcerpt(content, maxLength = 150) {
    // Remove HTML tags for excerpt
    const textOnly = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (textOnly.length <= maxLength) {
        return textOnly;
    }
    
    // Find the last complete word within maxLength
    const truncated = textOnly.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
}

function getDefaults(type, filename) {
    const baseDefaults = {
        id: filename.toLowerCase().replace(/[^a-z0-9]/g, '-')
    };
    
    switch (type) {
        case 'blog':
            return {
                ...baseDefaults,
                datePublished: new Date().toISOString().split('T')[0],
                category: 'General',
                readTime: '5 min read',
                wordCount: 0,
                excerpt: '',
                tags: []
            };
        case 'book':
            return {
                ...baseDefaults,
                dateRead: new Date().toISOString().split('T')[0],
                rating: 0,
                genre: 'Non-Fiction',
                author: '',
                title: '',
                shortDescription: '',
                fullDescription: '', // This will be the main content
                highlights: [],
                tags: []
            };
        case 'photo':
            return {
                ...baseDefaults,
                title: '',
                description: '', // This will be the main content
                date: new Date().toISOString().split('T')[0],
                filename: '',
                location: '',
                camera: '',
                settings: '',
                tags: []
            };
        default:
            return baseDefaults;
    }
}

function processDirectory(inputDir, outputDir, type) {
    if (!fs.existsSync(inputDir)) {
        console.log(`Input directory ${inputDir} does not exist.`);
        return;
    }
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const files = fs.readdirSync(inputDir).filter(file => 
        file.endsWith('.txt') || file.endsWith('.md')
    );
    
    if (files.length === 0) {
        console.log(`No .txt or .md files found in ${inputDir}`);
        return;
    }
    
    console.log(`\n📁 Processing ${files.length} file(s) from ${inputDir}:\n`);
    
    files.forEach(file => {
        const inputPath = path.join(inputDir, file);
        const outputFileName = path.basename(file, path.extname(file)) + '.json';
        const outputPath = path.join(outputDir, outputFileName);
        
        try {
            const parsed = parseContentFile(inputPath, type);
            // Let JSON.stringify handle all the escaping properly
            fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 4));
            console.log(`✅ ${file} → ${outputFileName} (${parsed.wordCount} words)`);
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    });
    
    console.log(`\n🎉 Processing complete!\n`);
}

// Command line interface
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log(`
Usage: node scripts/parse-content.js <type> <input-dir> <output-dir>

Types: blog, book, photo

Examples:
  node scripts/parse-content.js blog content/blog data/blogs
  node scripts/parse-content.js book content/books data/books  
  node scripts/parse-content.js photo content/photos data/photography

File format examples:

📝 BLOG POST (my-post.md) - Markdown format:
---
title: My Amazing Blog Post
datePublished: 2024-01-20
category: Tutorial
tags: ["web-dev", "javascript"]
# This is a comment in frontmatter
---

# Main Heading

This is my blog content with **bold text** and *italic text*!

## Subheading

Here's a quote:
> This is a blockquote that will become a styled quote block.

Here's some \`inline code\` and a list:
- First item
- Second item
- Third item

[This is a link](https://example.com)

📝 BLOG POST (my-post.txt) - HTML format:
---
title: My Amazing Blog Post
datePublished: 2024-01-20
category: Tutorial
tags: ["web-dev", "javascript"]
---

<h1>Main Heading</h1>

This is my blog content with <strong>bold text</strong> and <em>italic text</em>!

<h2>Subheading</h2>

<blockquote class="blog-quote">This is a styled quote block.</blockquote>

Here's some <code class="blog-code-inline">inline code</code>.

<a href="https://example.com">This is a link</a>

📚 BOOK REVIEW (book-title.md):
---
title: Atomic Habits
author: James Clear
rating: 9
genre: Non-Fiction
dateRead: 2024-01-15
shortDescription: A practical guide to building good habits.
highlights:
  - "You do not rise to the level of your goals."
  - "Habits are the compound interest of self-improvement"
tags: ["productivity", "habits"]
---

This becomes the fullDescription field.

<strong>Why I loved this book:</strong>
The approach is refreshingly practical...

📸 PHOTO (photo-name.md):
---
title: Mountain Sunset
filename: sunset-mountains.jpg
location: Colorado, USA
date: 2024-08-15
camera: Canon EOS R5
settings: f/8, 1/250s, ISO 100
tags: ["landscape", "mountains"]
---

This becomes the description field.
Golden hour lighting over the Rocky Mountains.

Features:
- ✅ Frontmatter is optional (--- markers not required)
- ✅ HTML tags are preserved exactly
- ✅ Comments supported in frontmatter (#)
- ✅ HTML comments preserved in content
- ✅ Automatic word count calculation
- ✅ Auto-generated excerpts
- ✅ Content can start anywhere in the file
`);
    process.exit(1);
}

const [type, inputDir, outputDir] = args;
processDirectory(inputDir, outputDir, type);