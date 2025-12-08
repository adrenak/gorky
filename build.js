const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Read markdown file
const markdownPath = path.join(__dirname, 'home.md');
const templatePath = path.join(__dirname, 'index-template.html');
const outputPath = path.join(__dirname, 'index.html');

try {
    // Read markdown
    const markdown = fs.readFileSync(markdownPath, 'utf8');
    
    // Convert to HTML using marked
    const htmlContent = marked.parse(markdown);
    
    // Read template
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholder
    const finalHTML = template.replace('{{MARKDOWN_CONTENT}}', htmlContent);
    
    // Write output
    fs.writeFileSync(outputPath, finalHTML, 'utf8');
    
    console.log('✓ Successfully generated index.html from home.md');
} catch (error) {
    console.error('Error building HTML:', error.message);
    process.exit(1);
}

