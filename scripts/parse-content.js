// Install: npm install marked
const { marked } = require('marked');

// Create a custom renderer that properly handles the new marked API
const renderer = {
    table(header, body) {
        if (header) {
            header = `<thead>\n${header}</thead>\n`;
        }
        if (body) {
            body = `<tbody>\n${body}</tbody>\n`;
        }
        return `<table class="blog-table">\n${header}${body}</table>\n`;
    },
    
    tablerow(content) {
        return `<tr>\n${content}</tr>\n`;
    },
    
    tablecell(content, flags) {
        const type = flags.header ? 'th' : 'td';
        const tag = flags.align
            ? `<${type} align="${flags.align}">`
            : `<${type}>`;
        return tag + content + `</${type}>\n`;
    },
    
    blockquote(quote) {
        return `<blockquote class="blog-quote">\n${quote}</blockquote>\n`;
    },
    
    code(code, infostring, escaped) {
        return `<code class="blog-code-inline">${escaped ? code : escape(code)}</code>`;
    },
    
    codespan(code) {
        return `<code class="blog-code-inline">${code}</code>`;
    }
};

// Helper function for escaping HTML
function escape(html) {
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function convertMarkdownToHTML(markdown) {
    // Use the new marked API
    marked.use({ renderer });
    
    // Configure options
    marked.setOptions({
        gfm: true, // GitHub Flavored Markdown (includes tables)
        breaks: false,
        pedantic: false,
        sanitize: false
    });
    
    return marked.parse(markdown);
}

// Alternative simpler approach if the above still doesn't work
function convertMarkdownToHTMLSimple(markdown) {
    // Just use basic marked and post-process
    const html = marked.parse(markdown, {
        gfm: true,
        breaks: false
    });
    
    // Add your CSS classes via string replacement
    return html
        .replace(/<table>/g, '<table class="blog-table">')
        .replace(/<blockquote>/g, '<blockquote class="blog-quote">')
        .replace(/<code>/g, '<code class="blog-code-inline">');
}

// Rest of your existing code stays the same...
const fs = require('fs');
const path = require('path');

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
    
    // Check if there's actually content to process
    if (!mainContent || mainContent.length === 0) {
        console.warn(`⚠️  Warning: ${path.basename(filePath)} has no content to process`);
        return null; // Return null for empty files
    }
    
    // Quick word count check before processing
    const preliminaryWordCount = calculateWordCount(mainContent);
    if (preliminaryWordCount === 0) {
        console.warn(`⚠️  Warning: ${path.basename(filePath)} has no readable content (0 words)`);
        return null; // Return null for files with no actual words
    }
    
    // Convert Markdown to HTML if the file is .md
    // Try the simple approach first, fall back to custom renderer if needed
    const finalContent = path.extname(filePath) === '.md' 
        ? convertMarkdownToHTMLSimple(mainContent)
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
            
            // Skip files that returned null (empty content)
            if (parsed === null) {
                console.log(`⏭️  ${file} → Skipped (no content)`);
                return;
            }
            
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
`);
    process.exit(1);
}

const [type, inputDir, outputDir] = args;
processDirectory(inputDir, outputDir, type);

module.exports = { convertMarkdownToHTML: convertMarkdownToHTMLSimple, parseContentFile };