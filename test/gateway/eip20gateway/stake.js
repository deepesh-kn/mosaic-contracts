// Copyright 2018 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
// Test: stake.js
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Gateway = artifacts.require("MockEIP20Gateway"),
    MockToken = artifacts.require("MockToken"),
    MessageBus = artifacts.require("MessageBus"),
    GatewayLib = artifacts.require("GatewayLib");


const utils = require("./../utils"),
    BN = require('bn.js'),
    EIP20GatewayKlass = require("./helpers/eip20gateway"),
    HelperKlass = require("./helpers/helper");

let stakeAmount,
    beneficiary,
    stakerAddress,
    gasPrice,
    gasLimit,
    nonce,
    hashLock,
    signature,
    messageHash,
    facilitator;

let mockToken,
    baseToken,
    gateway,
    helper,
    hashLockObj,
    gatewayTest;


async function _setup (accounts){
    const oThis = this;

    let hashLock = utils.generateHashLock();
    unlockSecret = hashLock.s;
    coGatewayAddress = accounts[3];
    facilitatorAddress = accounts[4];

    mockToken = await MockToken.new();
    tokenAddress = mockToken.address;
    baseToken = await MockToken.new();

    gateway = await Gateway.new(
        mockToken.address,
        baseToken.address,
        accounts[1],
        new BN(100),
        accounts[2],
        MessageBus.address
    );
    gatewayAddress = gateway.address;
    helper = new HelperKlass(gateway);
    gatewayTest = new EIP20GatewayKlass(gateway);
}

async function stake (resultType) {

    let params = {
        amount: stakeAmount,
        beneficiary: beneficiary,
        staker: stakerAddress,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        nonce: nonce,
        hashLock: hashLock,
        signature: signature,
    };

    let expectedResult = {
        returns: {messageHash: messageHash},
        events: {
            StakingIntentDeclared: {
                _messageHash: messageHash,
                _staker: stakerAddress,
                _stakerNonce: nonce,
                _beneficiary: beneficiary,
                _amount: stakeAmount
            }
        }
    };

    let txOption = {
        from: facilitator
    };

    await gatewayTest.stake(
        params,
        resultType,
        expectedResult,
        txOption
    );
}
contract('EIP20Gateway ',  function(accounts) {
    describe('stake', async function () {
        beforeEach(async function() {
            await _setup(accounts);
            hashLockObj = utils.generateHashLock();

            facilitator = accounts[0];
            nonce = await  helper.getNonce(accounts[1]);
            stakeAmount = new BN(100000000000);
            beneficiary = accounts[2];
            stakerAddress = accounts[1];
            gasPrice = new BN(200);
            gasLimit = new BN(900000);
            hashLock = hashLockObj.l;

            let typeHash = await helper.stakeTypeHash();

            let intentHash = await helper.hashStakingIntent(
                stakeAmount,
                beneficiary,
                stakerAddress,
                nonce,
                gasPrice,
                gasLimit,
                mockToken.address
            );

            let signData = await utils.signHash(
                typeHash,
                intentHash,
                nonce,
                gasPrice,
                gasLimit,
                stakerAddress);

            signature = signData.signature;
            messageHash = signData.digest;


        });

        it('Successfully stakes', async function() {
            console.log("stakeAmount: ", stakeAmount);
            console.log("beneficiary: ", beneficiary);
            console.log("stakerAddress: ", stakerAddress);
            console.log("gasPrice: ", gasPrice);
            console.log("gasLimit: ", gasLimit);
            console.log("nonce: ", nonce);
            console.log("hashLock: ", hashLock);
            console.log("signature: ", signature);
            console.log("messageHash: ", messageHash);

            await stake(utils.ResultType.SUCCESS);

        });

    });
});
