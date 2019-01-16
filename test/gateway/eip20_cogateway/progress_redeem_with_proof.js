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
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------


const EIP20CoGateway = artifacts.require("TestEIP20CoGateway");
const MockUtilityToken = artifacts.require("MockUtilityToken");
const BN = require("bn.js");

const messageBus = require('../../test_lib/message_bus.js');
const Utils = require("../../test_lib/utils.js");
const web3 = require("../../test_lib/web3.js");
const EventDecoder = require("../../test_lib/event_decoder");
const coGatewayUtils = require('./helpers/co_gateway_utils.js');
const proofData =  require("../../../test/data/redeem_progressed_1.json");

const ZeroBytes = Utils.ZERO_BYTES32;
const MessageStatusEnum = messageBus.MessageStatusEnum;

contract('EIP20CoGateway.progressRedeemWithProof() ', function (accounts) {

  let utilityToken, eip20CoGateway, redeemParams, bountyAmount, owner, facilitator;

  let setStorageRoot = async function() {

    let blockNumber = new BN(proofData.gateway.progress_unstake.proof_data.block_number, 16);
    let storageRoot = proofData.gateway.progress_unstake.proof_data.storageHash;
    await eip20CoGateway.setStorageRoot(blockNumber, storageRoot);

    blockNumber = new BN(proofData.gateway.confirm_redeem_intent.proof_data.block_number, 16);
    storageRoot = proofData.gateway.confirm_redeem_intent.proof_data.storageHash;
    await eip20CoGateway.setStorageRoot(blockNumber, storageRoot);
  };

  beforeEach(async function () {

    owner = accounts[0];
    facilitator = accounts[1];

    redeemParams = {
      redeemer: proofData.co_gateway.redeem.params.redeemer,
      amount: new BN(proofData.co_gateway.redeem.params.amount, 16),
      beneficiary: proofData.co_gateway.redeem.params.beneficiary,
      gasPrice: new BN(proofData.co_gateway.redeem.params.gasPrice, 16),
      gasLimit: new BN(proofData.co_gateway.redeem.params.gasLimit, 16),
      nonce: new BN(proofData.co_gateway.redeem.params.nonce, 16),
      hashLock: proofData.co_gateway.redeem.params.hashLock,
      messageHash: proofData.co_gateway.progress_redeem.params.messageHash,
      rlpParentNodes: proofData.gateway.confirm_redeem_intent.proof_data.storageProof[0].serializedProof,
      blockHeight: new BN(proofData.gateway.confirm_redeem_intent.proof_data.block_number, 16),
      messageStatus: MessageStatusEnum.Declared
    };

    utilityToken = await MockUtilityToken.new(
      accounts[9],
      "",
      "",
      18,
      accounts[2],
    );

    bountyAmount = new BN(proofData.co_gateway.constructor.bounty);

    eip20CoGateway = await EIP20CoGateway.new(
      proofData.co_gateway.constructor.valueToken,
      utilityToken.address,
      proofData.co_gateway.constructor.stateRootProvider,
      bountyAmount,
      proofData.co_gateway.constructor.organization,
      proofData.co_gateway.constructor.gateway,
      proofData.co_gateway.constructor.burner,
    );

    let redeemIntentHash = coGatewayUtils.hashRedeemIntent(
      redeemParams.amount,
      redeemParams.beneficiary,
      proofData.contracts.coGateway,
    );

    await eip20CoGateway.setMessage(
      redeemIntentHash,
      redeemParams.nonce,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.redeemer,
      redeemParams.hashLock,
    );

    await eip20CoGateway.setRedeem(
      redeemParams.messageHash,
      redeemParams.beneficiary,
      redeemParams.amount
    );

    await eip20CoGateway.setOutboxStatus(
      redeemParams.messageHash,
      MessageStatusEnum.Declared,
    );

    // Set co-gateway to owner so that increase supply can be called.
    await utilityToken.setCoGatewayAddress(owner);
    // Send redeem amount to co-gateway.
    await  utilityToken.increaseSupply(eip20CoGateway.address, redeemParams.amount, {from: owner});
    // Send bounty to co-gateway.
    await web3.eth.sendTransaction(
      {to: eip20CoGateway.address, from: facilitator, value: bountyAmount}
    );
    await utilityToken.setCoGatewayAddress(eip20CoGateway.address);

  });

  it('should fail when message hash is zero ', async function () {

    await Utils.expectRevert(
      eip20CoGateway.progressRedeemWithProof(
        ZeroBytes,
        redeemParams.rlpParentNodes,
        redeemParams.blockHeight,
        redeemParams.messageStatus
      ),
      'Message hash must not be zero.',
    );

  });

  it('should fail when storage proof is zero ', async function () {

    await Utils.expectRevert(
      eip20CoGateway.progressRedeemWithProof(
        redeemParams.messageHash,
        '0x',
        redeemParams.blockHeight,
        redeemParams.messageStatus
      ),
      'RLP parent nodes must not be zero.',
    );

  });

  it('should fail when storage proof is incorrect ', async function () {

    await setStorageRoot();

    await Utils.expectRevert(
      eip20CoGateway.progressRedeemWithProof(
        redeemParams.messageHash,
        proofData.co_gateway.redeem.proof_data.storageProof[0].serializedProof,
        redeemParams.blockHeight,
        redeemParams.messageStatus
      ),
      'Merkle proof verification failed.',
    );

  });

  it('should fail when storage proof is invalid ', async function () {

    await setStorageRoot();

    await Utils.expectRevert(
      eip20CoGateway.progressRedeemWithProof(
        redeemParams.messageHash,
        "0x1234",
        redeemParams.blockHeight,
        redeemParams.messageStatus
      ),
      'VM Exception while processing transaction: revert',
    );

  });

  it('should fail when storage root is not committed for the given height ',
    async function () {

      await Utils.expectRevert(
        eip20CoGateway.progressRedeemWithProof(
          redeemParams.messageHash,
          redeemParams.rlpParentNodes,
          redeemParams.blockHeight,
          redeemParams.messageStatus
        ),
        'Storage root must not be zero.',
      );

  });

  it('should fail when message outbox status at source is undeclared ',
    async function () {

      await setStorageRoot();

      await Utils.expectRevert(
        eip20CoGateway.progressRedeemWithProof(
          web3.utils.sha3("dummy"),
          redeemParams.rlpParentNodes,
          redeemParams.blockHeight,
          redeemParams.messageStatus
        ),
        'Status of message on source must be Declared or DeclareRevocation.',
      );

  });

  it('should fail when message outbox status at source is progressed ',
    async function () {

      await eip20CoGateway.setOutboxStatus(
        redeemParams.messageHash,
        MessageStatusEnum.Progressed,
      );

      await setStorageRoot();

      await Utils.expectRevert(
        eip20CoGateway.progressRedeemWithProof(
          redeemParams.messageHash,
          redeemParams.rlpParentNodes,
          redeemParams.blockHeight,
          redeemParams.messageStatus
        ),
        'Status of message on source must be Declared or DeclareRevocation.',
      );

  });

  it('should fail when message outbox status at source is revoked ',
    async function () {

      await eip20CoGateway.setOutboxStatus(
        redeemParams.messageHash,
        MessageStatusEnum.Revoked,
      );

      await setStorageRoot();

      await Utils.expectRevert(
        eip20CoGateway.progressRedeemWithProof(
          redeemParams.messageHash,
          redeemParams.rlpParentNodes,
          redeemParams.blockHeight,
          redeemParams.messageStatus,
        ),
        'Status of message on source must be Declared or DeclareRevocation.',
      );

  });

  it('should fail when message inbox status at target is declared and outbox ' +
    'status at source is revocation declared', async function () {

    await eip20CoGateway.setOutboxStatus(
      redeemParams.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await setStorageRoot();

    await Utils.expectRevert(
      eip20CoGateway.progressRedeemWithProof(
        redeemParams.messageHash,
        redeemParams.rlpParentNodes,
        redeemParams.blockHeight,
        MessageStatusEnum.Declared,
      ),
      'Message on target must be Progressed.',
    );

  });

  it('should pass when message inbox status at target and outbox ' +
    'status at source is declared', async function () {

    await setStorageRoot();

    let result = await eip20CoGateway.progressRedeemWithProof.call(
      redeemParams.messageHash,
      redeemParams.rlpParentNodes,
      redeemParams.blockHeight,
      redeemParams.messageStatus,
    );

    assert.strictEqual(
      result.redeemer_,
      redeemParams.redeemer,
      `Redeemer address must be equal to ${redeemParams.redeemer}`,
    );

    assert.strictEqual(
      result.redeemAmount_.eq(redeemParams.amount),
      true,
      `Redeem amount must be equal to ${redeemParams.amount.toString(10)}`,
    );

    let tx = await eip20CoGateway.progressRedeemWithProof(
      redeemParams.messageHash,
      redeemParams.rlpParentNodes,
      redeemParams.blockHeight,
      redeemParams.messageStatus,
    );

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );

  });


  it('should pass when message inbox status at target is progressed and outbox ' +
    'status at source is declared', async function () {

    await setStorageRoot();

    let result = await eip20CoGateway.progressRedeemWithProof.call(
      redeemParams.messageHash,
      proofData.gateway.progress_unstake.proof_data.storageProof[0].serializedProof,
      new BN(proofData.gateway.progress_unstake.proof_data.block_number, 16),
      MessageStatusEnum.Progressed,
    );

    assert.strictEqual(
      result.redeemer_,
      redeemParams.redeemer,
      `Redeemer address must be equal to ${redeemParams.redeemer}`,
    );

    assert.strictEqual(
      result.redeemAmount_.eq(redeemParams.amount),
      true,
      `Redeem amount must be equal to ${redeemParams.amount.toString(10)}`,
    );

    let tx = await eip20CoGateway.progressRedeemWithProof(
      redeemParams.messageHash,
      proofData.gateway.progress_unstake.proof_data.storageProof[0].serializedProof,
      new BN(proofData.gateway.progress_unstake.proof_data.block_number, 16),
      MessageStatusEnum.Progressed,
    );

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );

  });

  it('should pass when message inbox status at target is progressed and outbox' +
    ' status at source is revocation declared', async function () {

    await eip20CoGateway.setOutboxStatus(
      redeemParams.messageHash,
      MessageStatusEnum.DeclaredRevocation,
    );

    await setStorageRoot();

    let result = await eip20CoGateway.progressRedeemWithProof.call(
      redeemParams.messageHash,
      proofData.gateway.progress_unstake.proof_data.storageProof[0].serializedProof,
      new BN(proofData.gateway.progress_unstake.proof_data.block_number, 16),
      MessageStatusEnum.Progressed,
    );

    assert.strictEqual(
      result.redeemer_,
      redeemParams.redeemer,
      `Redeemer address must be equal to ${redeemParams.redeemer}`,
    );

    assert.strictEqual(
      result.redeemAmount_.eq(redeemParams.amount),
      true,
      `Redeem amount must be equal to ${redeemParams.amount.toString(10)}`,
    );

    let tx = await eip20CoGateway.progressRedeemWithProof(
      redeemParams.messageHash,
      proofData.gateway.progress_unstake.proof_data.storageProof[0].serializedProof,
      new BN(proofData.gateway.progress_unstake.proof_data.block_number, 16),
      MessageStatusEnum.Progressed,
    );

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );

  });

  it('should emit RedeemProgressed event', async function () {

    await setStorageRoot();

    let tx = await eip20CoGateway.progressRedeemWithProof(
      redeemParams.messageHash,
      proofData.gateway.progress_unstake.proof_data.storageProof[0].serializedProof,
      new BN(proofData.gateway.progress_unstake.proof_data.block_number, 16),
      MessageStatusEnum.Progressed,
    );

    let event = EventDecoder.getEvents(tx, eip20CoGateway);
    let eventData = event.RedeemProgressed;

    assert.equal(
      tx.receipt.status,
      1,
      "Receipt status is unsuccessful",
    );

    assert.isDefined(
      event.RedeemProgressed,
      'Event `RedeemProgressed` must be emitted.',
    );

    assert.strictEqual(
      eventData._messageHash,
      redeemParams.messageHash,
      `Message hash ${eventData._messageHash} from event is not equal to expected message hash ${redeemParams.messageHash}`,
    );

    assert.strictEqual(
      eventData._redeemer,
      redeemParams.redeemer,
      `Redeemer address ${eventData._redeemer} from event is not equal to expected redeemer address ${redeemParams.redeemer}`,
    );

    assert.strictEqual(
      eventData._redeemerNonce.eq(redeemParams.nonce),
      true,
      `Redeemer nonce ${eventData._redeemerNonce} from event is not equal to expected redeemer nonce ${redeemParams.nonce}`,
    );

    assert.strictEqual(
      eventData._amount.eq(redeemParams.amount),
      true,
      `Redeem amount ${eventData._amount} from event is not equal to expected amount ${redeemParams.amount}`,
    );

    assert.strictEqual(
      eventData._proofProgress,
      true,
      `Proof progress flag from event should be true.`,
    );

    assert.strictEqual(
      eventData._unlockSecret,
      ZeroBytes,
      `Actual unlockSecret ${eventData._unlockSecret} from event is not equal to expected unlockSecret ${ZeroBytes}`,
    );

  });

  it('should return bounty to the facilitator', async function () {

    let facilitator = accounts[8];
    let initialFacilitatorEthBalance = await Utils.getBalance(facilitator);
    let initialCoGatewayEthBalance = await Utils.getBalance(eip20CoGateway.address);

    await setStorageRoot();

    let tx = await eip20CoGateway.progressRedeemWithProof(
      redeemParams.messageHash,
      proofData.gateway.progress_unstake.proof_data.storageProof[0].serializedProof,
      new BN(proofData.gateway.progress_unstake.proof_data.block_number, 16),
      MessageStatusEnum.Progressed,
      { from: facilitator },
    );

    let finalFacilitatorEthBalance = await Utils.getBalance(facilitator);
    let finalCoGatewayEthBalance = await Utils.getBalance(eip20CoGateway.address);

    let expectedFinalFacilitatorETHBalance = initialFacilitatorEthBalance
      .add(bountyAmount)
      .subn(tx.receipt.gasUsed);

    assert.strictEqual(
      finalFacilitatorEthBalance.eq(expectedFinalFacilitatorETHBalance),
      true,
      `Bounty should be return to facilitator.`,
    );

    assert.strictEqual(
      finalCoGatewayEthBalance.eq(initialCoGatewayEthBalance.sub(bountyAmount)),
      true,
      `Bounty should be transferred from co-gateway.`,
    );

  });

  it('should decrease token supply for utility token', async function () {

    let initialTotalSupply = await utilityToken.totalSupply.call();
    let initialCoGatewayBalance = await utilityToken.balanceOf(eip20CoGateway.address);

    await setStorageRoot();

    await eip20CoGateway.progressRedeemWithProof(
      redeemParams.messageHash,
      proofData.gateway.progress_unstake.proof_data.storageProof[0].serializedProof,
      new BN(proofData.gateway.progress_unstake.proof_data.block_number, 16),
      MessageStatusEnum.Progressed,
      { from: facilitator },
    );

    let finalTotalSupply = await utilityToken.totalSupply.call();
    let finalCoGatewayBalance = await utilityToken.balanceOf(eip20CoGateway.address);

    assert.strictEqual(
      finalTotalSupply.eq(initialTotalSupply.sub(redeemParams.amount)),
      true,
      `Total supply should be reduced after progressRedeem.`,
    );

    assert.strictEqual(
      finalCoGatewayBalance.eq(initialCoGatewayBalance.sub(redeemParams.amount)),
      true,
      `Co-gateway balance should be reduced.`,
    );

  });

});