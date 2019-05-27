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

const OSTComposer = artifacts.require('TestOSTComposer');
const SpyToken = artifacts.require('SpyToken');
const Gateway = artifacts.require('SpyEIP20Gateway');
const MockOrganization = artifacts.require('MockOrganization');
const BN = require('bn.js');
const Utils = require('../test_lib/utils');

contract('OSTComposer.acceptStakeRequest() ', (accounts) => {
  let organization;
  let ostComposer;
  let gateway;
  const stakeRequest = {};
  let stakeHash;
  let hashLock;
  let worker;
  let activeGatewayCountForStaker;

  beforeEach(async () => {
    const owner = accounts[6];
    worker = accounts[7];
    organization = await MockOrganization.new(owner, worker);
    stakeRequest.staker = accounts[2];
    ostComposer = await OSTComposer.new(organization.address);
    stakeRequest.amount = new BN(20);
    stakeRequest.beneficiary = accounts[4];
    stakeRequest.gasPrice = new BN(100);
    stakeRequest.gasLimit = new BN(100);
    stakeRequest.nonce = new BN(42);
    gateway = await Gateway.new();
    stakeHash = await web3.utils.sha3('mockedhash');
    hashLock = Utils.generateHashLock().l;
    await ostComposer.setStakeRequestHash(stakeHash, stakeRequest.staker, gateway.address);
    await ostComposer.setStakeRequests(
      stakeRequest.staker,
      gateway.address,
      stakeRequest.amount,
      stakeRequest.gasPrice,
      stakeRequest.gasLimit,
      stakeRequest.beneficiary,
      stakeRequest.nonce,
      stakeHash,
    );
    activeGatewayCountForStaker = 1;
    await ostComposer.generateStakerProxy(stakeRequest.staker);
    await ostComposer.setActiveStakeRequestCount(stakeRequest.staker, activeGatewayCountForStaker);
  });

  it('should be able to successfully accept stake', async () => {
    const activeGatewayRequestCountBeforeAS = await ostComposer.activeStakeRequestCount(
      stakeRequest.staker,
    );

    const response = await ostComposer.acceptStakeRequest(
      stakeHash,
      hashLock,
      { from: worker },
    );

    assert.strictEqual(response.receipt.status, true, 'Receipt status is unsuccessful');

    const activeGatewayRequestCountAfterAS = await ostComposer.activeStakeRequestCount(
      stakeRequest.staker,
    );

    assert.strictEqual(
      (activeGatewayRequestCountBeforeAS.sub(activeGatewayRequestCountAfterAS)).eqn(1),
      true,
      `Expected active gateway request for ${stakeRequest.staker} is `
      + `${activeGatewayRequestCountBeforeAS.sub(activeGatewayRequestCountAfterAS)}`
      + `but got ${activeGatewayRequestCountAfterAS}`,
    );

    // Verifying the storage stakeRequestHash and stakeRequests. After the revokeStakeRequest
    // is successful, these two storage are references are cleared.
    const stakeRequestHashStorage = await ostComposer.stakeRequestHashes.call(
      stakeRequest.staker,
      gateway.address,
    );

    const stakeRequestsStorage = await ostComposer.stakeRequests.call(stakeHash);

    assert.strictEqual(
      stakeRequestHashStorage,
      Utils.ZERO_BYTES32,
      `Stake requests of ${stakeRequest.staker} for ${gateway.address} is not cleared`,
    );

    assert.strictEqual(
      stakeRequestsStorage.amount.eqn(0),
      true,
      `Expected amount is 0 but got ${stakeRequestsStorage.amount}`,
    );

    assert.strictEqual(
      stakeRequestsStorage.beneficiary,
      Utils.NULL_ADDRESS,
      'Beneficiary address must be reset to null address',
    );

    assert.strictEqual(
      stakeRequestsStorage.gasPrice.eqn(0),
      true,
      `Expected gasPrice is 0 but got ${stakeRequestsStorage.gasPrice}`,
    );

    assert.strictEqual(
      stakeRequestsStorage.gasLimit.eqn(0),
      true,
      `Expected gasLimit is 0 but got ${stakeRequestsStorage.gasLimit}`,
    );

    assert.strictEqual(
      stakeRequestsStorage.nonce.eqn(0),
      true,
      `Expected nonce is 0 but got ${stakeRequestsStorage.nonce}`,
    );

    assert.strictEqual(
      stakeRequestsStorage.staker,
      Utils.NULL_ADDRESS,
      'Staker address must be reset to null address',
    );

    assert.strictEqual(
      stakeRequestsStorage.gateway,
      Utils.NULL_ADDRESS,
      'Gateway address must be reset to null address',
    );
  });

  it('should fail when stake request hash is null', async () => {
    await Utils.expectRevert(ostComposer.acceptStakeRequest(
      Utils.ZERO_BYTES32,
      hashLock,
      { from: worker },
    ),
    'Stake request hash is zero.');
  });

  it('should fail when value tokens transfer to staker proxy fails', async () => {
    const spyValueToken = await SpyToken.at(await gateway.valueToken.call());
    await spyValueToken.setTransferFakeResponse(false);

    await Utils.expectRevert(ostComposer.acceptStakeRequest(
      stakeHash,
      hashLock,
      { from: worker },
    ),
    'Staked amount must be transferred to the staker proxy.');
  });

  it('should fail when bounty transfer to staker proxy fails', async () => {
    const spyBaseToken = await SpyToken.at(await gateway.baseToken.call());
    await spyBaseToken.setTransferFromFakeResponse(false);
    await Utils.expectRevert(ostComposer.acceptStakeRequest(
      stakeHash,
      hashLock,
      { from: worker },
    ),
    'Bounty amount must be transferred to stakerProxy.');
  });
});
