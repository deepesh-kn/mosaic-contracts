#!/bin/bash

mkdir publish/contract_build 2> /dev/null || true
mkdir publish/interacts 2> /dev/null || true
mkdir publish/deployers 2> /dev/null || true
node tools/interacts_generator_tool/src/build_package.js
./node_modules/.bin/ts-generator tools/interacts_generator_tool/ts-generator.json
node tools/interacts_generator_tool/src/contract_interact_generator.js
node tools/interacts_generator_tool/src/deploy_contract_generator.js
