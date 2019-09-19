#!/usr/bin/env node

const uuidv4 = require('uuid/v4');
const chalk = require('chalk');
const fs = require('fs');
const utils = require('./nodejs-sdk/packages/api/common/utils');
const Configuration = require('./nodejs-sdk/packages/api/common/configuration').Configuration;
const Web3jService = require('./nodejs-sdk/packages/api').Web3jService;

Configuration.setConfig('./conf/config.json');
let web3jService = new Web3jService();

let contractAddress = null;
let addUserAbi = null;
let saveMoneyAbi = null;
let getBalanceAbi = null;
let addUserSig = null;
let saveMoneySig = null;
let getBalanceSig = null;

async function test() {
    console.log(chalk.blue(`[INFO] ------------------------- Normal transaction -------------------------`));
    let blockHeight = await web3jService.getBlockNumber();
    blockHeight = parseInt(blockHeight.result, 16);
    let blockLimit = blockHeight + 500;

    let config = Configuration.getInstance();
    let user = config.account;

    console.log(`[INFO] Regiter ${user} in bank`);
    await web3jService.sendRawTransaction(contractAddress, addUserSig, []);
    
    console.log(`[INFO] Save money for ${user} with money 0xaaaaa(699050)`);
    let transaction = await web3jService.rawTransaction(contractAddress, saveMoneySig, [0xaaaaa], blockLimit);
    console.log('[INFO] Original transaction: ' + transaction);
    console.log('[INFO] Now sending ...');

    let receipt = await web3jService.sendRawTransaction(transaction);
    if (receipt.status !== '0x0') {
        console.log(chalk.red("[ERROR] Sending failed"));
        process.exit(-1);
    }

    console.log(chalk.green("[INFO] Sending success"));
    let balance = await web3jService.call(contractAddress, getBalanceSig, []);
    balance = utils.decodeMethod(getBalanceAbi, balance.result.output)[0].toString();
    console.log(`[INFO] The balance of ${user} is ${balance}`);

    console.log(chalk.blue(`[INFO] ------------------------- Illegal transaction -------------------------`));
    console.log(`[INFO] Save money for ${user} with money: 0x22222(139810)`);
    transaction = await web3jService.rawTransaction(contractAddress, saveMoneySig, [0x22222], blockLimit);
    console.log('[INFO] Original transaction: ' + transaction.replace("22222", chalk.yellow("22222")));
    console.log(`[INFO] But ${user} want to increase his saving money to 0xfffff(1048575)`);
    transaction = transaction.replace('22222', 'fffff');
    console.log(`[INFO] Tampered transaction: ${transaction.replace("fffff", chalk.yellow("fffff"))}`);
    console.log('[INFO] Now sending ...');

    receipt = await web3jService.sendRawTransaction(transaction);
    if (receipt.status === '0x0') {
        console.log(chalk.green("[INFO] Sending success"));
    } else {
        console.log(chalk.red("[ERROR] Sending failed"));
    }

    balance = await web3jService.call(contractAddress, getBalanceSig, []);
    balance = utils.decodeMethod(getBalanceAbi, balance.result.output)[0].toString();
    console.log(`[INFO] The balance of ${user} is ${balance}`);
}

console.log("[INFO] Test start");
console.log("[INFO] Deploying Bank contract ...")
web3jService.deploy('./Bank.sol', './.output').then(receipt => {
    if (receipt.status === '0x0') {
        console.log(chalk.green("[INFO] Deploying success, contract address: " + receipt.contractAddress));
        
        contractAddress = receipt.contractAddress;

        let abi = JSON.parse(fs.readFileSync('./.output/Bank.abi').toString());

        addUserAbi = abi.find(item => {
            return item.name === 'addUser';
        });
        saveMoneyAbi = abi.find(item => {
            return item.name === 'saveMoney';
        });
        getBalanceAbi = abi.find(item => {
            return item.name === 'getBalance';
        });

        addUserSig = utils.spliceFunctionSignature(addUserAbi);
        saveMoneySig = utils.spliceFunctionSignature(saveMoneyAbi);
        getBalanceSig = utils.spliceFunctionSignature(getBalanceAbi);

        test().then(() => {
            console.log("[INFO] Test end");
        });
    } else {
        console.log(chalk.red("[ERROR] Deploying failed"));
    }
});



