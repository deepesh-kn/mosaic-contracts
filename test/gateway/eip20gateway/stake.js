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

const Gateway = artifacts.require("EIP20Gateway"),
    MockToken = artifacts.require("MockToken"),
    MessageBus = artifacts.require("MessageBus"),
    GatewayLib = artifacts.require("GatewayLib");

const utils = require("./../utils"),
    BN = require('bn.js');

const gatewayTest = new GatewayKlass();

let messageHash,
    gatewayAddress,
    coGatewayAddress,
    tokenAddress,
    unlockSecret,
    facilitatorAddress;

let gateway,
    gatewayHelper;

const Stake = function(){};

Stake.prototype = {

    _setup: async function (accounts){

        let hashLock = utils.generateHashLock();
        unlockSecret = hashLock.s;
        coGatewayAddress = accounts[3];
        facilitatorAddress = accounts[4];

        let mockToken = await MockToken.new();
        tokenAddress = mockToken.address;

        gateway = await Gateway.new(
            mockToken.address,
            mockToken.address,
            accounts[1],
            new BN(100),
            accounts[2],
            MessageBus.address
        );
        gatewayAddress = gateway.address;
        // gateway helper.
        gatewayHelper = new Helper(gateway);
        gatewayTest.setGateway(gateway);

        let typeHash = await gatewayHelper.gatewayLinkTypeHash(),
            sender = accounts[2],
            nonce = await gatewayHelper.getNonce(sender);

        let intentHash = await gatewayHelper.hashLinkGateway(
            gatewayAddress,
            coGatewayAddress,
            MessageBus.address,
            "Mock Token",
            "MOCK",
            new BN(18),
            nonce,
            tokenAddress
        );

        let signData = await utils.signHash(
            typeHash,
            intentHash,
            nonce,
            new BN(0),
            new BN(0),
            sender);

        messageHash = signData.digest;

        // initiateGatewayLink
        let response = await gateway.initiateGatewayLink(
            coGatewayAddress,
            intentHash,
            nonce,
            sender,
            hashLock.l,
            signData.signature,
            {from: facilitatorAddress}
        );
    },

    progressGatewayLink: async function (resultType) {
        let params = {
            messageHash: messageHash,
            unlockSecret: unlockSecret,
        };

        let expectedResult = {
            returns: {
                isSuccess: resultType == utils.ResultType.FAIL ? false: true
            },
            events: {
                GatewayLinkProgressed: {
                    _messageHash: messageHash,
                    _gateway: gatewayAddress,
                    _cogateway: coGatewayAddress,
                    _token: tokenAddress,
                    _unlockSecret: unlockSecret
                }
            }
        };

        let txOption = {
            from: facilitatorAddress
        };

        await gatewayTest.progressGatewayLink(
            params,
            resultType,
            expectedResult,
            txOption
        );
    },

    perform: function (accounts) {

        const oThis = this;

        beforeEach(async function() {
            await oThis._setup(accounts);
        });

        it('fails when messageHash is 0', async function() {

        });

    }
};

module.exports = Stake;
