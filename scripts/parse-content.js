// Install: npm install marked
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

// Configure marked with custom renderer for your CSS classes
const renderer = new marked.Renderer();

// Customize the renderer for your specific CSS classes
renderer.code = function(code, language) {
    return `<code class="blog-code-inline">${code}</code>`;
};

renderer.blockquote = function(quote) {
    return `<blockquote class="blog-quote">${quote}</blockquote>`;
};

renderer.table = function(header, body) {
    return `<table class="blog-table">
<thead>${header}</thead>
<tbody>${body}</tbody>
</table>`;
};

// Configure marked options
marked.setOptions({
    renderer: renderer,
    gfm: true, // GitHub Flavored Markdown (includes tables)
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
});

function convertMarkdownToHTML(markdown) {
    return marked(markdown);
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
    
    // Get all content
    const contentLines = lines.slice(contentStartIndex);
    const mainContent = contentLines.join('\n').trim();
    
    // Convert Markdown to HTML if the file is .md
    const finalContent = path.extname(filePath) === '.md' 
        ? convertMarkdownToHTML(mainContent)
        : mainContent;
    
    // Calculate word count
    const wordCount = calculateWordCount(finalContent);
    
    // Generate excerpt if not provided
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
                fullDescription: '',
                highlights: [],
                tags: []
            };
        case 'photo':
            return {
                ...baseDefaults,
                title: '',
                description: '',
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

Table example in Markdown:
| Column 1 | Column 2 | Column 3 |
|----------|:--------:|---------:|
| Left     | Center   | Right    |
| Data     | More     | Values   |

Features:
- ✅ Full GitHub Flavored Markdown support (including tables)
- ✅ Custom CSS classes for your styling
- ✅ Proper table parsing with alignment
- ✅ All your existing frontmatter features
`);
    process.exit(1);
}

const [type, inputDir, outputDir] = args;
processDirectory(inputDir, outputDir, type);