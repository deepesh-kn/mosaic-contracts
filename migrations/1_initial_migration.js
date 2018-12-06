var Migrations = artifacts.require("./Migrations.sol");

// all libraries.
var MerklePatriciaProof = artifacts.require('MerklePatriciaProof');
var MockMerklePatriciaProof = artifacts.require('MockMerklePatriciaProof');
var MockMerklePatriciaProofFail = artifacts.require("MockMerklePatriciaProofFail");
var MessageBus = artifacts.require('MessageBus');
var MockMessageBus = artifacts.require('MockMessageBus');
var MockMessageBusFail = artifacts.require('MockMessageBusFail');
var GatewayLib = artifacts.require('GatewayLib');
var MockGatewayLib = artifacts.require('MockGatewayLib');
var MetaBlock = artifacts.require('MetaBlock');
var BlockStore = artifacts.require('BlockStore');

// all contracts.
var GatewayBase = artifacts.require('GatewayBase');
var EIP20Gateway = artifacts.require('EIP20Gateway');
var MockGatewayBase = artifacts.require('MockGatewayBase');
var TestEIP20Gateway = artifacts.require('TestEIP20Gateway');
var EIP20CoGateway = artifacts.require('EIP20CoGateway');
var AuxiliaryBlockStore = artifacts.require('AuxiliaryBlockStore');
var MessageBusWrapper = artifacts.require('MessageBusWrapper');
var MessageBusWrapperFail = artifacts.require("MessageBusWrapperFail");
var MerklePatriciaProofTest = artifacts.require('MerklePatriciaProofTest');
var TestKernelGateway = artifacts.require('TestKernelGateway');
var TestKernelGatewayFail = artifacts.require('TestKernelGatewayFail');
var KernelGateway = artifacts.require('KernelGateway');

module.exports = function(deployer) {
  deployer.deploy(Migrations);

  // deploy the primary libraries first.
  deployer.deploy(MerklePatriciaProof);
  deployer.deploy(MockMerklePatriciaProof);
  deployer.deploy(MockMerklePatriciaProofFail);
  deployer.deploy(MockGatewayLib);
  deployer.deploy(MetaBlock);

  // link and deploy the dependent secondary libraries
  deployer.link(MerklePatriciaProof, MessageBus);
  deployer.deploy(MessageBus);

  deployer.link(MockMerklePatriciaProof, [MockMessageBus]);
  deployer.deploy(MockMessageBus);

  deployer.link(MockMessageBusFail, MessageBusWrapperFail);
  deployer.deploy(MockMessageBusFail);

  deployer.link(MerklePatriciaProof, GatewayLib);
  deployer.deploy(GatewayLib);

  // Link the contracts.
  deployer.link(
    MerklePatriciaProof,
    [KernelGateway, TestKernelGateway, TestKernelGatewayFail]
  );
  deployer.link(GatewayLib, [GatewayBase, EIP20Gateway, TestEIP20Gateway, EIP20CoGateway]);
  deployer.link(MessageBus, [EIP20CoGateway,TestEIP20Gateway, EIP20Gateway]);
  deployer.link(MockGatewayLib, [MockGatewayBase, TestEIP20Gateway]);
  deployer.link(MetaBlock, [BlockStore, AuxiliaryBlockStore]);
  deployer.link(MockMessageBus, MessageBusWrapper);
  deployer.link(MerklePatriciaProof, MerklePatriciaProofTest);
  deployer.link(MockMerklePatriciaProofFail, [MockMessageBusFail]);

};
