/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

const getAllFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath)

    files.forEach((file) => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles)
        } else if (path.basename(file).endsWith('.cy.ts')) {
            arrayOfFiles.push(path.join(dirPath, file))
        }
    })

    return arrayOfFiles
}

const createGroups = (files, numberOfGroups = 5) => {
    const groups = []
    for (let i = 0; i < numberOfGroups; i++) {
        groups.push([])
    }

    files.forEach((file, index) => {
        groups[index % numberOfGroups].push(file)
    })

    /* If a group is empty the runner will actually run the tests
     * for ALL FILES. So we need to ensure we only create populated
     * test groups */
    return groups
        .filter((group) => group.length > 0)
        .map((group, index) => ({ id: index + 1, tests: group }))
}

const cypressSpecsPath = './cypress/e2e'
const specs = getAllFiles(cypressSpecsPath)
const groupedSpecs = createGroups(specs)

console.log(JSON.stringify(groupedSpecs))
