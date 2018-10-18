const MessageBus = artifacts.require("./gateway/MessageBus.sol");
const GatewayLib = artifacts.require("./gateway/GatewayLib.sol");
const GatewayBase = artifacts.require("./gateway/GatewayBase.sol");
const Gateway = artifacts.require("Gateway");
const MockGatewayLib = artifacts.require("MockGatewayLib");
const MockGatewayBase = artifacts.require("MockGatewayBase");
const MockEIP20Gateway = artifacts.require("MockEIP20Gateway");

module.exports = function(deployer) {
  deployer.deploy(MessageBus);
  deployer.deploy(GatewayLib);
  deployer.deploy(MockGatewayLib);
  deployer.link(GatewayLib, [GatewayBase, Gateway, MockEIP20Gateway]);
  deployer.link(MessageBus, [Gateway, MockEIP20Gateway]);
  deployer.link(MockGatewayLib, [MockGatewayBase]);
};


