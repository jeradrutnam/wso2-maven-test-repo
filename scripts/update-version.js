/**
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Shell script for Jenkins (Post script in the build pipeline):
 *
 * #!/usr/bin/env bash
 * npm i
 *
 * # Update package version to parent pom version
 * npm run update-version -- jenkins=true
 *
 * git commit -m "[WSO2 Release] [Jenkins ${BUILD_DISPLAY_NAME}] 
                    [Release ${POM_VERSION/-SNAPSHOT/}] update package versions"
 *
 */

const path = require('path');
const fs = require('fs-extra');
const glob = require('glob-fs')({ gitignore: true });
const XmlParser = require('fast-xml-parser');
const { execSync } = require('child_process');

const packageJson =  path.join(__dirname, "..", "package.json");
const pomXml = path.join(__dirname, "..", "pom.xml");
const workingDir = path.join(__dirname, "..");

const git = require('simple-git/promise')(workingDir);

const getProjectVersion = function() {
    const fileContent = fs.readFileSync(pomXml);
    const pom = XmlParser.parse(fileContent.toString());

    return pom.project.version.replace("-SNAPSHOT", "");
};

let packageJsonContent = require(packageJson);
packageJsonContent.version = getProjectVersion();


/**
 * Update package, package-lock, lerna json files
 */
fs.writeFileSync(packageJson, JSON.stringify(packageJsonContent, null, 4)+"\n");

execSync("npx lerna version " + getProjectVersion() + 
         " --yes --no-git-tag-version --force-publish && npm i",
    { cwd: path.join(__dirname, "..") }
);

console.log("lerna info update packages version to " + getProjectVersion());


/**
 * Collect args
 */
const processArgs = process.argv.slice(2);
let args = {};

processArgs.forEach(function(arg, index){
    const argSplit = arg.split("=");
    args[argSplit[0]] = argSplit[1];
});

const packageFiles = ["package.json", "package-lock.json", "lerna.json"]

/**
 * Stage changed files
 */
if (args.jenkins){
    console.log("stage version updated files");
    
    git.status().then((status) => {
        status.files.map((file) => {
            const filePath = file.path;
            const fileName = filePath.split("/").slice(-1)[0];
            
            if(packageFiles.includes(fileName)) {
                git.add(filePath);
            }
        });
    });
}
