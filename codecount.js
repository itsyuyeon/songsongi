import fs from 'fs';
const path = require('path');

function countLinesInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.split('\n').length;
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error}`);
        return 0;
    }
}

function getCodeFiles(dir) {
    const codeExtensions = ['.js'];
    let files = [];

    try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            // Skip node_modules directory
            if (item === 'node_modules') continue;

            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                files = files.concat(getCodeFiles(fullPath));
            } else if (codeExtensions.includes(path.extname(fullPath))) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}: ${error}`);
    }

    return files;
}

function countTotalLines() {
    const currentDir = process.cwd();
    const files = getCodeFiles(currentDir);
    let totalLines = 0;
    let fileCount = 0;

    console.log('Counting lines in code files...\n');

    files.forEach(file => {
        const lines = countLinesInFile(file);
        totalLines += lines;
        fileCount++;
        console.log(`${file}: ${lines} lines`);
    });

    console.log(`\nTotal files: ${fileCount}`);
    console.log(`Total lines of code: ${totalLines}`);
}

countTotalLines();