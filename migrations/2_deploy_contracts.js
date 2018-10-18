let MessageBus = artifacts.require("./gateway/MessageBus.sol"),
    GatewayLib = artifacts.require("./gateway/GatewayLib.sol"),
    Gateway = artifacts.require("Gateway"),
    MockEIP20Gateway = artifacts.require("MockEIP20Gateway");

module.exports = function(deployer) {
    deployer.deploy(MessageBus);
    deployer.deploy(GatewayLib);
    deployer.link(GatewayLib, [Gateway,MockEIP20Gateway]);
    deployer.link(MessageBus, [Gateway,MockEIP20Gateway]);
};


