// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract ParellaxVault {
    using ECDSA for bytes32;

    address public owner;
    address public verifiedBrain;

    mapping(bytes32 => bool) public usedVerifications;

    event Deposited(address indexed from, uint256 amount);
    event Released(address indexed to, uint256 amount, string verificationId);
    event BrainUpdated(address indexed newBrain);

    error Unauthorized();
    error InsufficientBalance();
    error VerificationReused();
    error InvalidSignature();
    error ZeroAmount();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _verifiedBrain) {
        owner = msg.sender;
        verifiedBrain = _verifiedBrain;
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function deposit() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function setVerifiedBrain(address _brain) external onlyOwner {
        verifiedBrain = _brain;
        emit BrainUpdated(_brain);
    }

    function release(
        address payable to,
        uint256 amount,
        string calldata verificationId,
        bytes calldata signature
    ) external {
        if (amount == 0) revert ZeroAmount();
        if (address(this).balance < amount) revert InsufficientBalance();

        bytes32 vId = keccak256(bytes(verificationId));
        if (usedVerifications[vId]) revert VerificationReused();

        bytes32 msgHash = keccak256(abi.encodePacked(to, amount, verificationId));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        address signer = ethHash.recover(signature);
        if (signer != verifiedBrain) revert InvalidSignature();

        usedVerifications[vId] = true;
        (bool ok,) = to.call{value: amount}("");
        require(ok, "transfer failed");

        emit Released(to, amount, verificationId);
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
