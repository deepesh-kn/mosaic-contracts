var Migrations = artifacts.require("./contracts/truffle/Migrations.sol");
console.log("Migrations: ",Migrations);

// all libraries.
var MerklePatriciaProof = artifacts.require('./contracts/lib/MerklePatriciaProof.sol');
console.log("MerklePatriciaProof: ",MerklePatriciaProof);

var MockMerklePatriciaProof = artifacts.require('./contracts/test/MockMerklePatriciaProof.sol');
console.log("MockMerklePatriciaProof: ",MockMerklePatriciaProof);

var MockMerklePatriciaProofFail = artifacts.require("./contracts/test/MockMerklePatriciaProofFail.sol");
console.log("MockMerklePatriciaProofFail: ",MockMerklePatriciaProofFail);

var MessageBus = artifacts.require('./contracts/gateway/MessageBus.sol');
console.log("MessageBus: ",MessageBus);

var MockMessageBus = artifacts.require('./contracts/test/MockMessageBus.sol');
console.log("MockMessageBus: ",MockMessageBus);

var MockMessageBusFail = artifacts.require('./contracts/test/MockMessageBusFail.sol');
console.log("MockMessageBusFail: ",MockMessageBusFail);

var GatewayLib = artifacts.require('./contracts/lib/GatewayLib.sol');
console.log("GatewayLib: ",GatewayLib);

var MockGatewayLib = artifacts.require('./contracts/test/MockGatewayLib.sol');
console.log("MockGatewayLib: ",MockGatewayLib);

var BlockStore = artifacts.require('./contracts/core/BlockStore.sol');
console.log("BlockStore: ",BlockStore);


// all contracts.
var GatewayBase = artifacts.require('./contracts/gateway/GatewayBase.sol');
console.log("GatewayBase: ",GatewayBase);

var EIP20Gateway = artifacts.require('./contracts/gateway/EIP20Gateway.sol');
console.log("EIP20Gateway: ",EIP20Gateway);

var MockGatewayBase = artifacts.require('./contracts/test/MockGatewayBase.sol');
console.log("MockGatewayBase: ",MockGatewayBase);

var TestEIP20Gateway = artifacts.require('./contracts/test/TestEIP20Gateway.sol');
console.log("TestEIP20Gateway: ",TestEIP20Gateway);

var EIP20CoGateway = artifacts.require('./contracts/gateway/EIP20CoGateway.sol');
console.log("EIP20CoGateway: ",EIP20CoGateway);

var AuxiliaryBlockStore = artifacts.require('./contracts/core/AuxiliaryBlockStore.sol');
console.log("AuxiliaryBlockStore: ",AuxiliaryBlockStore);

var MerklePatriciaProofTest = artifacts.require('./contracts/lib/MerklePatriciaProofTest.sol');
console.log("MerklePatriciaProofTest: ",MerklePatriciaProofTest);

var TestKernelGateway = artifacts.require('./contracts/core/TestKernelGateway.sol');
console.log("TestKernelGateway: ",TestKernelGateway);

var TestKernelGatewayFail = artifacts.require('./contracts/core/TestKernelGatewayFail.sol');
console.log("TestKernelGatewayFail: ",TestKernelGatewayFail);

var KernelGateway = artifacts.require('./contracts/core/KernelGateway.sol');
console.log("KernelGateway: ",KernelGateway);

var MessageBusWrapper = artifacts.require('./contracts/test/MessageBusWrapper.sol');
console.log("MessageBusWrapper: ",MessageBusWrapper);

var MessageBusWrapperFail = artifacts.require("./contracts/test/MessageBusWrapperFail.sol");
console.log("MessageBusWrapperFail: ",MessageBusWrapperFail);


module.exports = async function(deployer) {
  await deployer.deploy(Migrations);

  // deploy the primary libraries first.
  await deployer.deploy(MerklePatriciaProof);
  await deployer.deploy(MockMerklePatriciaProof);
  await deployer.deploy(MockMerklePatriciaProofFail);
  await deployer.deploy(MockGatewayLib);

  // link and deploy the dependent secondary libraries
  await deployer.link(MerklePatriciaProof, MessageBus);
  await deployer.deploy(MessageBus);

  await deployer.link(MockMerklePatriciaProof, MockMessageBus);
  await deployer.deploy(MockMessageBus);

  await deployer.link(MockMerklePatriciaProofFail, MockMessageBusFail);
  await deployer.deploy(MockMessageBusFail);

  await deployer.link(MerklePatriciaProof, GatewayLib);
  await deployer.deploy(GatewayLib);

  // Link the contracts.
  await deployer.link(
    MerklePatriciaProof,
    [KernelGateway, TestKernelGateway, TestKernelGatewayFail]
  );
  await deployer.link(GatewayLib, [GatewayBase, EIP20Gateway, TestEIP20Gateway, EIP20CoGateway]);
  await deployer.link(MessageBus, [EIP20CoGateway,TestEIP20Gateway, EIP20Gateway]);
  await deployer.link(MockGatewayLib, [MockGatewayBase, TestEIP20Gateway]);
  await deployer.link(MerklePatriciaProof, MerklePatriciaProofTest);
  await deployer.link(MockMessageBus, MessageBusWrapper);
  await deployer.link(MockMessageBusFail, MessageBusWrapperFail);
};
