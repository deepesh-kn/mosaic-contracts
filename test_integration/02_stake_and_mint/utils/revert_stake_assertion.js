// Copyright 2019 OpenST Ltd.
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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const assert = require('assert');

/**
 * Stake Request object contains all the properties for stake and mint flow.
 * @typedef {Object} StakeRequest
 * @property {BN} amount Stake amount.
 * @property {BN} gasPrice Gas price that staker is ready to pay to get the stake
 *                         and mint process done.
 * @property {BN} gasLimit Gas limit that staker is ready to pay.
 * @property {string} staker Address of stake.
 * @property {BN} bounty Bounty amount paid for stake and mint message
 *                       transfers.
 * @property {BN} nonce Stake nonce.
 * @property {string} beneficiary Address of beneficiary on auxiliary chain.
 * @property {string} hashLock Hash Lock provided by the staker.
 * @property {string} unlockSecret Unlock secret to unlock hash lock.
 * @property {string} messageHash Identifier for stake and mint process.
 * @property {BN} blockHeight Height at which anchor state root is done.
 */

/**
 * BaseToken(ETH) and token ERC20 balance of gateway, staker and
 * stakeVault.
 * @typedef {Object} Balances
 * @property balances.token.gateway ERC20 balance of gateway contract.
 * @property balances.token.staker ERC20 balance of beneficiary.
 * @property balances.token.stakeVault ERC20 balance of stakeVault contract.
 * @property balances.baseToken.gateway Base token(ETH) balance of gateway.
 * @property balances.baseToken.staker Base token(ETH) balance of staker.
 * @property balances.baseToken.stakeVault Base token(ETH) balance of stakeVault
 */

/**
 * Class to assert event and balances after revert stake.
 */
class RevertStakeAssertion {
  /**
     * Constructor.
     * @param {Object} gateway Truffle gateway instance.
     * @param {Object} token Truffle token instance.
     * @param {Object} baseToken Truffle baseToken instance.
     */
  constructor(gateway, token, baseToken) {
    this.gateway = gateway;
    this.token = token;
    this.baseToken = baseToken;
  }

  /**
     * This verifies event and balances.
     * @param {Object} event Event object after decoding.
     * @param {StakeRequest}stakeRequest Stake request parameters.
     * @param {Balances} initialBalances Initial baseToken and token balances.
     */
  async verify(event, stakeRequest, initialBalances) {
    await this._assertBalancesForRevertStake(stakeRequest, initialBalances);

    RevertStakeAssertion._assertRevertStakeEvent(event, stakeRequest);
  }

  /**
     * This captures base token and token balance of gateway, staker and
     * stake vault.
     * @param {string} staker Staker address/
     * @return {Promise<Balances>}
     */
  async captureBalances(staker) {
    const burner = await this.gateway.burner.call();

    return {
      baseToken: {
        burner: await this.baseToken.balanceOf(burner),
        gateway: await this.baseToken.balanceOf(this.gateway.address),
        staker: await this.baseToken.balanceOf(staker),
      },
      token: {
        burner: await this.token.balanceOf(burner),
        gateway: await this.token.balanceOf(this.gateway.address),
        staker: await this.token.balanceOf(staker),
      },
    };
  }

  /**
     * This asserts balances of staker and gateway after revert stake.
     * @param stakeRequest Stake request parameters.
     * @param {Balances} initialBalances Initial balance of staker and gateway
     *                                   generated by captureBalances method.
     * @private
     */
  async _assertBalancesForRevertStake(stakeRequest, initialBalances) {
    const finalBalances = await this.captureBalances(stakeRequest.staker);

    // Assert gateway balance
    const penaltyFactor = await this.gateway.REVOCATION_PENALTY.call();
    const penalty = stakeRequest.bounty.mul(penaltyFactor).divn(100);

    const expectedGatewayBaseTokenBalance = initialBalances.baseToken.gateway;

    // Assert Penalty is transferred to gateway.
    assert.strictEqual(
      expectedGatewayBaseTokenBalance.eq(finalBalances.baseToken.gateway),
      true,
      `Gateway base token balance must be ${expectedGatewayBaseTokenBalance.toString(10)}`
           + ` instead of ${finalBalances.baseToken.gateway.toString(10)}`,
    );

    const expectedGatewayTokenBalance = initialBalances.token.gateway;

    // Assert stake amount is transferred to gateway.
    assert.strictEqual(
      expectedGatewayTokenBalance.eq(finalBalances.token.gateway),
      true,
      `Gateway token balance must be ${expectedGatewayBaseTokenBalance.toString(10)}`
           + ` instead of ${finalBalances.token.gateway.toString(10)}`,
    );

    // Assert staker balance
    const expectedStakerBaseTokenBalance = initialBalances.baseToken.staker
      .sub(penalty);

    // Assert penalty is transferred to gateway.
    assert.strictEqual(
      expectedStakerBaseTokenBalance.eq(finalBalances.baseToken.staker),
      true,
      `Staker base token balance must be ${expectedStakerBaseTokenBalance.toString(10)}`
           + ` instead of ${finalBalances.baseToken.staker.toString(10)}`,
    );

    const expectedStakerTokenBalance = initialBalances.token.staker;

    assert.strictEqual(
      expectedStakerTokenBalance.eq(finalBalances.token.staker),
      true,
      `Staker token balance must be ${expectedStakerTokenBalance.toString(10)}`
           + ` instead of ${finalBalances.token.staker.toString(10)}`,
    );

    // Assert burner balance
    const expectedBurnerBaseTokenBalance = initialBalances.baseToken.burner.add(penalty);

    assert.strictEqual(
      expectedBurnerBaseTokenBalance.eq(finalBalances.baseToken.burner),
      true,
      `Burner base token balance must be ${expectedBurnerBaseTokenBalance.toString(10)} instead of ${finalBalances.baseToken.burner.toString(10)}`,
    );

    const expectedBurnerTokenBalance = initialBalances.token.burner;

    assert.strictEqual(
      expectedBurnerTokenBalance.eq(finalBalances.token.burner),
      true,
      `Burner token balance must be ${expectedBurnerTokenBalance.toString(10)} instead of ${finalBalances.token.burner.toString()}`,
    );
  }

  /**
     * This assert event after revert stake method.
     * @param {Object} event Event object after decoding.
     * @param {StakeRequest} stakeRequest Stake request parameters.
     * @private
     */
  static _assertRevertStakeEvent(event, stakeRequest) {
    const eventData = event.RevertStakeIntentDeclared;

    assert.strictEqual(
      eventData._messageHash,
      stakeRequest.messageHash,
      `Expected message hash ${
        eventData._messageHash
      } is different from actual message hash ${stakeRequest.messageHash}`,
    );
    assert.strictEqual(
      eventData._staker,
      stakeRequest.staker,
      `Expected message hash ${
        eventData._staker
      } is different from actual message hash ${stakeRequest.staker}`,
    );
    assert.strictEqual(
      eventData._amount.eq(stakeRequest.amount),
      true,
      `Expected stake amount ${
        eventData._amount
      } is different from actual stake amount ${stakeRequest.amount}`,
    );
    assert.strictEqual(
      eventData._stakerNonce.eq(stakeRequest.nonce),
      true,
      `Expected staker nonce ${
        eventData._stakerNonce
      } is different from actual staker nonce ${stakeRequest.nonce}`,
    );
  }
}

module.exports = RevertStakeAssertion;
