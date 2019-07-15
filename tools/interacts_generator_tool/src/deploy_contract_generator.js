#!/usr/bin/env node

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

/**
 * This file reads the contents from `contract_build/contracts.json` and
 * auto-generates the contract interacts factory methods.
 */

const fs = require('fs');
const path = require('path');

const contractPath = path.join(
  __dirname,
  `../../../publish/contract_build/contracts.json`,
);

// Check if the contract.json file exists.
if (!fs.existsSync(contractPath)) {
  throw new Error(
    `Cannot read file ${contractPath}.`
    + 'Build package must run before generating contract interacts.'
    + 'That should be done automatically when running `npm publish`.',
  );
}

const baseDeployer = `
class DeployContract {
  public signer: string;
  public abi?: any;
  public bin?: string;
  public web3: any;

  constructor(web3: any, signer: string) {
    this.signer = signer;
    this.web3 = web3;
  }
  private getContract(): any {
    const contract = new this.web3.eth.Contract(this.abi);
    contract.options.data = this.bin;
    return contract;
  }

  deployContract(params: any[], trasactionOptions: any) {
    const contract = this.getContract();

    return new Promise(((resolve, reject) => {
      contract.deploy({ arguments: params})
        .send(trasactionOptions)
        .then((newContractInstance) => {
          console.log(newContractInstance.options.address); // instance with the new contract address
          resolve(newContractInstance);
        })
        .catch((err) => {
          reject(err);
        });
    }));
  }

  estimateGas(params: any[]) {
    const contract = this.getContract();

    return new Promise((resolve, reject)=> {
      contract.deploy({ arguments: params})
        .estimateGas()
        .then((gas) => {
          resolve(gas);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

export default DeployContract;
`;

// Create the file.
fs.writeFileSync(
  'publish/deployers/DeployContract.ts',
  `${baseDeployer}`
);

const allABIs = JSON.parse(fs.readFileSync(contractPath));

// Get all the contract names.
const contractNames = Object.keys(allABIs);
const allGeneratedDeployerName = [];

contractNames.forEach((contract) => {
  // This variable holds all the import statements as string.
  let imports = '';

  const declarationFilePath = path.join(
    __dirname,
    `../../../publish/interacts/${contract}.d.ts`,
  );
  if (fs.existsSync(declarationFilePath)) {
    imports = `import DeployContract from \'./DeployContract\';\n`;
    imports = `${imports}import * as contracts from \'../contract_build/contracts.json\';\n`;
    imports = `${imports}import { ${contract} } from \'../interacts/${contract}\';\n`;

    let constructorParams = '';
    let callParams = '';
    allABIs[contract].abi.forEach((func,index)=> {
      if (func.type === 'constructor') {
        func.inputs.forEach((param, index)=>{
          constructorParams = `${constructorParams}${param.name}: string,\n`;
          callParams = `${callParams} ${param.name},\n`
        });
      }
    });

    const deployerCode = `
    class ${contract}Deployer extends DeployContract{
      constructor(web3: any, signer: string) {
        super(web3, signer);
        this.abi = contracts.${contract}.abi;
        this.bin = contracts.${contract}.bin;
      }
      
      public async deploy(\n${constructorParams}): Promise<${contract}>{
          const params = [\n${callParams}];

        const estimatedGas = await this.estimateGas(params)
          .catch((e) => {
            console.log("Exception while estimate gas", e);
          });
        const transactionOption = {from: this.signer, gas: estimatedGas};
        return await this.deployContract(params, transactionOption) as ${contract};
      }
    }
    export default ${contract}Deployer;    
  `;
    // Create the file.
    fs.writeFileSync(
      `publish/deployers/${contract}Deployer.ts`,
      `${imports}\n${deployerCode}`
    );

    allGeneratedDeployerName.push(`${contract}Deployer`);
  }


  let allImports = '';
  let allExports = '';
  allGeneratedDeployerName.forEach((name) => {
    allImports = `${allImports}import ${name} from './${name}';\n`;
    allExports = `${allExports}${name},\n`
  });

  // Create the file.
  fs.writeFileSync(
    `publish/deployers/Deployer.ts`,
    `${allImports}\n\n export {\n${allExports}}\n`
  );
});



/*


import {Anchor} from "../publish/interacts/Anchor";

const Web3 = require('web3');
import { deployers } from '../publish/index';

class ManualTest {
  deployAnchor() {
    const web3 = new Web3('http://localhost:8545');
    const signer = '0x913da4198e6be1d5f5e4a40d0667f70c0b5430eb';
    const deployer = new deployers.AnchorDeployer(web3, signer);
    console.log('here ');
    deployer.deploy(
      '1000',
      '0',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '100',
      '0x913da4198e6be1d5f5e4a40d0667f70c0b5430eb'
    ).then(async (anchor: Anchor)=>{
      console.log('getRemoteChainId: ', await anchor.methods.getRemoteChainId().call());
      console.log('coAnchor: ', await anchor.methods.coAnchor().call());
      console.log('organization: ', await anchor.methods.organization().call());
      console.log('getStateRoot: ', await anchor.methods.getStateRoot(0).call());

    }) .catch((e)=>{
      console.log('Execption: ', e);
    });

  }
}

const test = new ManualTest();
test.deployAnchor();


 */
