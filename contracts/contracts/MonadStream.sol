// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MonadStream
 * @dev Designed for Monad Hackathon to demonstrate Parallel EVM capabilities.
 */

contract MonadStream is ReentrancyGuard, Ownable{
    using SafeERC20 for IERC20;

    IERC20 public immutable token;

    struct Stream {
        address creator;
        uint256 goalTarget;
        uint256 raised;
        string goalTitle;
    }

    mapping(bytes32 => Stream) public streams;
    mapping(bytes32 => mapping(bytes32 => uint256)) public giftPrice; // streamId => giftId => price

    event StreamCreated(bytes32 indexed streamId, address indexed creator);
    event GoalSet(bytes32 indexed streamId, string title, uint256 target);
    event GiftPriceSet(bytes32 indexed streamId, bytes32 indexed giftId, uint256 price);
    event GiftSent(bytes32 indexed streamId, address indexed sender, bytes32 indexed giftId, uint256 amount, uint256 raised);
    event GoalReached(bytes32 indexed streamId, uint256 raised);


    error NotCreator();
    error StreamExists();
    error UnknownGift();

    constructor(IERC20 _token) Ownable(msg.sender) {
        token = _token;
    }

    modifier onlyCreator(bytes32 id) {
        if (msg.sender != streams[id].creator) revert NotCreator();
        _;
    }

    function createStream(bytes32 id) external {
        if (streams[id].creator != address(0)) revert StreamExists();
        streams[id].creator = msg.sender;
        emit StreamCreated(id, msg.sender);
    }

    function setGoal(bytes32 id, string calldata title, uint256 target) external onlyCreator(id) {
        Stream storage s = streams[id];
        s.goalTitle = title;
        s.goalTarget = target;
        s.raised = 0;
        emit GoalSet(id, title, target);
    }

    function setGiftPrice(bytes32 id, bytes32 giftId, uint256 price) external onlyCreator(id) {
        giftPrice[id][giftId] = price;
        emit GiftPriceSet(id, giftId, price);
    }

    function sendGift(bytes32 id, bytes32 giftId) external {
        Stream storage s = streams[id];
        uint256 price = giftPrice[id][giftId];
        if (s.creator == address(0) || price == 0) revert UnknownGift();

        token.safeTransferFrom(msg.sender, s.creator, price); // straight to the creator, contract holds no funds

        uint256 before = s.raised;
        s.raised = before + price;
        emit GiftSent(id, msg.sender, giftId, price, s.raised);

        if (s.goalTarget != 0 && before < s.goalTarget && s.raised >= s.goalTarget) {
            emit GoalReached(id, s.raised);
        }
    }
}