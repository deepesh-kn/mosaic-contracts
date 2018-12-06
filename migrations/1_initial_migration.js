var Migrations = artifacts.require("./Migrations.sol");

// all libraries.
var MerklePatriciaProof = artifacts.require('./contracts/lib/MerklePatriciaProof.sol');
var MockMerklePatriciaProof = artifacts.require('./contracts/test/MockMerklePatriciaProof.sol');
var MockMerklePatriciaProofFail = artifacts.require("./contracts/test/MockMerklePatriciaProofFail.sol");
var MessageBus = artifacts.require('./contracts/gateway/MessageBus.sol');
var MockMessageBus = artifacts.require('./contracts/test/MockMessageBus.sol');
var MockMessageBusFail = artifacts.require('./contracts/test/MockMessageBusFail.sol');
var GatewayLib = artifacts.require('./contracts/lib/GatewayLib.sol');
var MockGatewayLib = artifacts.require('./contracts/test/MockGatewayLib.sol');
var MetaBlock = artifacts.require('./contracts/lib/MetaBlock.sol');
var BlockStore = artifacts.require('./contracts/core/BlockStore.sol');

// all contracts.
var GatewayBase = artifacts.require('./contracts/gateway/GatewayBase.sol');
var EIP20Gateway = artifacts.require('./contracts/gateway/EIP20Gateway.sol');
var MockGatewayBase = artifacts.require('./contracts/test/MockGatewayBase.sol');
var TestEIP20Gateway = artifacts.require('./contracts/test/TestEIP20Gateway.sol');
var EIP20CoGateway = artifacts.require('./contracts/gateway/EIP20CoGateway.sol');
var AuxiliaryBlockStore = artifacts.require('./contracts/core/AuxiliaryBlockStore.sol');
var MerklePatriciaProofTest = artifacts.require('./contracts/lib/MerklePatriciaProofTest.sol');
var TestKernelGateway = artifacts.require('./contracts/core/TestKernelGateway.sol');
var TestKernelGatewayFail = artifacts.require('./contracts/core/TestKernelGatewayFail.sol');
var KernelGateway = artifacts.require('./contracts/core/KernelGateway.sol');
var MessageBusWrapper = artifacts.require('./contracts/test/MessageBusWrapper.sol');
var MessageBusWrapperFail = artifacts.require("./contracts/test/MessageBusWrapperFail.sol");



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

  deployer.link(MockMerklePatriciaProofFail, [MockMessageBusFail]);
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
  deployer.link(MerklePatriciaProof, MerklePatriciaProofTest);
  deployer.link(MockMessageBus, MessageBusWrapper);
  deployer.link(MockMessageBusFail, MessageBusWrapperFail);


};
