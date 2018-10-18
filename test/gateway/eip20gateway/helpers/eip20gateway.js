'use strict';

const EIP20Gateway = artifacts.require("EIP20Gateway");
const web3 = require('../../../lib/web3.js');
const utils = require("../../utils");

const EIP20GatewayKlass = function(gateway) {
    const oThis = this;
    oThis.gateway = gateway;
};
EIP20GatewayKlass.prototype = {
    gateway: null,

    stake: async function(
        params,
        resultType,
        expectedResults,
        txOptions ) {

        console.log("Inside Stake");
        const oThis = this;

        let amount = params.amount,
            beneficiary = params.beneficiary,
            staker = params.staker,
            gasPrice = params.gasPrice,
            gasLimit = params.gasLimit,
            nonce = params.nonce,
            hashLock = params.hashLock,
            signature = params.signature;

        if (resultType == utils.ResultType.FAIL) {
            await utils.expectThrow(oThis.gateway.stake.call(
                amount,
                beneficiary,
                staker,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                signature,
                txOptions
            ));
        } else {

            let result = await oThis.gateway.stake.call(
                amount,
                beneficiary,
                staker,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                signature,
                txOptions
            );

            assert.equal(
                result,
                expectedResults.returns.messageHash,
                "messageHash must match"
            );

            let response = await oThis.gateway.stake(
                amount,
                beneficiary,
                staker,
                gasPrice,
                gasLimit,
                nonce,
                hashLock,
                signature,
                txOptions
            );

            assert.equal(
                response.receipt.status,
                1,
                "Receipt status is unsuccessful"
            );
            let eventData = response.logs;
            utils.validateEvents(eventData, expectedResults.events);
        }
    }
};
module.exports = EIP20GatewayKlass;
