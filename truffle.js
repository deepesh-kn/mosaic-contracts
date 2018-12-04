module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      network_id: "*", // Match any network id
      port: 8545,
    }
  },
  compilers: {
    solc: {
      settings: {
        optimizer: {
          enabled: true,
          // set to same number of runs as openst-platform
          // so that integration tests on openst-protocol
          // give accurate gas measurements
          runs: 200,
        },
      },
    },
  },
};
