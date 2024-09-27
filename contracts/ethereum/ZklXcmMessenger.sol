// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IWormhole {
    struct VM {
        uint8 version;
        uint32 timestamp;
        uint32 nonce;
        uint16 emitterChainId;
        bytes32 emitterAddress;
        uint64 sequence;
        uint8 consistencyLevel;
        bytes payload;
        uint32 guardianSetIndex;
        bytes32 hash;
        bytes signatures;
    }

    function publishMessage(uint32 nonce, bytes memory payload, uint8 consistencyLevel) external payable returns (uint64 sequence);
    function parseAndVerifyVM(bytes memory encodedVM) external view returns (VM memory vm, bool valid, string memory reason);
}

contract ZklXcmMessenger is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    IWormhole public wormhole;
    uint16 public chainId;
    uint256 public messageFee;
    
    mapping(bytes32 => bool) public processedMessages;
    mapping(address => Message[]) public userMessages;
    
    struct Message {
        string pubKey1;
        string pubKey2;
        string encryptedData;
        uint256 timestamp;
        address sender;
    }
    
    event MessageSent(bytes32 indexed messageHash, address indexed sender, uint16 targetChain);
    event MessageReceived(bytes32 indexed messageHash, address indexed recipient);
    event MessageFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _wormhole, uint16 _chainId, uint256 _messageFee) Ownable(msg.sender) ReentrancyGuard() {
        require(_wormhole != address(0), "Invalid Wormhole address");
        require(_chainId > 0, "Invalid chain ID");
        require(_messageFee > 0, "Invalid message fee");
        wormhole = IWormhole(_wormhole);
        chainId = _chainId;
        messageFee = _messageFee;
    }

    function sendMessage(
        string memory pubKey1,
        string memory pubKey2,
        string memory encryptedData,
        uint16 targetChain
    ) external payable nonReentrant {
        require(msg.value >= messageFee, "Insufficient fee");
        require(bytes(pubKey1).length > 0 && bytes(pubKey2).length > 0 && bytes(encryptedData).length > 0, "Invalid input");
        require(targetChain != chainId, "Cannot send messages to the same chain");
        
        bytes memory payload = abi.encode(pubKey1, pubKey2, encryptedData, msg.sender);
        require(payload.length <= 350, "Payload size exceeds limit");

        uint32 nonce = uint32(block.timestamp);
        
        uint64 sequence = wormhole.publishMessage{value: messageFee}(nonce, payload, 1); // consistency level 1
        
        bytes32 messageHash = keccak256(abi.encodePacked(sequence, payload, chainId, targetChain));
        emit MessageSent(messageHash, msg.sender, targetChain);

        // Refund excess fee
        if (msg.value > messageFee) {
            payable(msg.sender).transfer(msg.value - messageFee);
        }
    }

    function receiveMessage(bytes memory encodedVM) external nonReentrant {
        (IWormhole.VM memory vm, bool valid, string memory reason) = wormhole.parseAndVerifyVM(encodedVM);
        
        require(valid, reason);
        require(vm.emitterChainId != chainId, "Cannot receive messages from same chain");
        require(!processedMessages[vm.hash], "Message already processed");
        
        processedMessages[vm.hash] = true;
        
        (string memory pubKey1, string memory pubKey2, string memory encryptedData, address sender) = abi.decode(vm.payload, (string, string, string, address));
        
        address recipient = deriveRecipient(pubKey1, pubKey2);
        
        userMessages[recipient].push(Message(pubKey1, pubKey2, encryptedData, block.timestamp, sender));
        
        emit MessageReceived(vm.hash, recipient);
    }

    function getUserMessages(address user) external view returns (Message[] memory) {
        return userMessages[user];
    }

    function setMessageFee(uint256 _messageFee) external onlyOwner {
        require(_messageFee > 0, "Invalid message fee");
        uint256 oldFee = messageFee;
        messageFee = _messageFee;
        emit MessageFeeUpdated(oldFee, _messageFee);
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    function deriveRecipient(string memory pubKey1, string memory pubKey2) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(pubKey1, pubKey2)))));
    }

    // This function is for demonstration purposes only. In a real-world scenario,
    // decryption would happen client-side to maintain security.
    function decryptMessage(string memory encryptedData, bytes memory /*privateKey*/) external pure returns (string memory) {
        // Placeholder for client-side decryption
        return encryptedData;
    }

    receive() external payable {}
}