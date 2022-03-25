# Installing Node.js and npm from NVM

A quick recap on a few less robust alternatives for installing Node.js is a available at the bottom section. For all the alternatives, **npm** package manager is installed along with **node.js**.

## Installing from NVM

NVM is a version manager for Node.js by MIT. Follow the installation instruction in https://github.com/nvm-sh/nvm to install `node` and `npm` (`nvm` v0.38.0, `npm` v7.16.0, `node` v16.3.0)
1. Run the command below which downloads and runs the one-line installer
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```
2. After restarting the terminal, the following lines were added t the ~/.bash_profile
```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```
3. List available Node.js releases
```
nvm ls-remote
```
4. Run the below command for installing the latest LTS release (14.7.0). LTS schedule can be found [here](https://github.com/nodejs/Release#release-schedule).
```
nvm install --lts
```
5. Run the below command for installing the latest (the "Current") release (16.3.0)
```
nvm install node
```
6. Instead, you can install the System version from [Node.js](https://nodejs.org) site, downloading and running the installer package (refer to next section "Installing from Node.js Site https://nodejs.org").
7. Activate the desired version, for instance the latest
```
nvm use node
```
8. List installed and active versions
```
$ nvm ls
       v14.17.0
->      v16.3.0
         system
default -> 14.17.0 (-> v14.17.0)
iojs -> N/A (default)
unstable -> N/A (default)
node -> stable (-> v16.3.0) (default)
stable -> 16.3 (-> v16.3.0) (default)
lts/* -> lts/fermium (-> v14.17.0)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.17.1 (-> N/A)
lts/carbon -> v8.17.0 (-> N/A)
lts/dubnium -> v10.24.1 (-> N/A)
lts/erbium -> v12.22.1 (-> N/A)
lts/fermium -> v14.17.0

$ nvm --version
0.38.0
$ node --version
v16.3.0
$ npm --version
7.16.0
```

## Recap on a Few Alternatives

### Installing from Homebrew
```
brew install node
```
Available latest version is **stable 16.2.0**. Currently, **the compilation fails with multiple errors**: refer to installation with NVM.

### Installing from conda-forge
```
conda install nodejs
```
Latest version 15.14.0, which includes the executable `npm`. Currently, the **Installation partially succeeds**: refer to [previous comment](https://github.com/ami-iit/element_software-engineering/issues/47#issuecomment-855171484).

### Installing from Node.js Site https://nodejs.org

Long Term Support and latest version: 14.17.0 LTS, 16.3.0 Latest.

Downloaded and installed the v16.3.0 package `node-v16.3.0.pkg` (node v16.3.0, npm v7.15.1).
=> **Node.js** package installed in `/usr/local/bin/node`
=> **npm** package installed in `/usr/local/bin/npm`

Do not add these folders to PATH. Instead, activate system version through NVM tool:
```
nvm use system
```
"nvm ls" returns
```
       v14.17.0
        v16.3.0
-->    system
...
```

## Other Links on Installation Issues
https://stackoverflow.com/questions/11284634/upgrade-node-js-to-the-latest-version-on-mac-os#19333717
https://github.com/nasa/openmct-tutorial/issues/29 (common issues, more specifically on MacOS)
