pragma solidity ^0.4.23;

/* solium-disable */

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

import "../../core/BlockStoreInterface.sol";

/**
 * @notice BlockStoreMock implements the BlockStoreInterface. It returns pre-
 *         determined values for all methods.
 */
contract BlockStoreMock is BlockStoreInterface {

    /* Events */

    /** Emitted when the justify method is called. To be caught by tests. */
    event Justified(bytes32 _source, bytes32 _target);

    /* Public Variable */

    /* Return variables for the various methods. */
    bool public reportBlockSuccess;
    bytes32 public stateRoot;
    uint256 public latestBlockHeight;
    bool public isVoteValid;
    bool public isBlockReported;

    /* External Functions */

    /* Setter functions to set the wanted return values for testing. */

    function setReportBlockSuccess(bool _success) external {
        reportBlockSuccess = _success;
    }

    function setStateRoot(bytes32 _stateRoot) external {
        stateRoot = _stateRoot;
    }

    function setLatestBlockHeight(uint256 _height) external {
        latestBlockHeight = _height;
    }

    function setVoteValid(bool _isValid) external {
        isVoteValid = _isValid;
    }

    function setIsBlockReported(bool _isReported) external {
        isBlockReported = _isReported;
    }

    /* The methods of the interface, returning values from storage. */

    function reportBlock(
        bytes
    )
        external
        returns (bool success_)
    {
        success_ = reportBlockSuccess;
    }

    function justify(
        bytes32 _source,
        bytes32 _target
    )
        external
    {
        // Emits an event so that JS tests can listen for it.
        emit Justified(_source, _target);
    }

    function stateRoot(
        uint256
    )
        external
        view
        returns (bytes32 stateRoot_)
    {
        stateRoot_ = stateRoot;
    }

    function latestBlockHeight()
        external
        view
        returns (uint256 height_)
    {
        height_ = latestBlockHeight;
    }

    function isVoteValid(
        bytes32,
        bytes32,
        bytes32
    )
        external
        view
        returns (bool valid_)
    {
        valid_ = isVoteValid;
    }

    function isBlockReported(
        bytes32
    )
        external
        view
        returns (bool reported_)
    {
        reported_ = isBlockReported;
    }
}
