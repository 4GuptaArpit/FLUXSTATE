// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

abstract contract ShardedAccumulator {
    uint8 public constant NUM_SHARDS = 16;

    struct Shard {
        uint128 longOI;
        uint128 shortOI;
    }

    mapping(uint8 => Shard) public shards;

    event ShardAllocated(uint8 indexed shardId, bool indexed isLong, uint128 deltaSize, bool isIncrease);

    function getTraderShard(address trader) public pure returns (uint8) {
        return uint8(uint160(trader) % NUM_SHARDS);
    }

    function _modifyShardOI(
        address trader,
        bool isLong,
        uint128 deltaSize,
        bool isIncrease
    ) internal returns (uint8 shardId) {
        shardId = getTraderShard(trader);
        Shard storage s = shards[shardId];

        if (isLong) {
            if (isIncrease) {
                s.longOI += deltaSize;
            } else {
                s.longOI = s.longOI >= deltaSize ? s.longOI - deltaSize : 0;
            }
        } else {
            if (isIncrease) {
                s.shortOI += deltaSize;
            } else {
                s.shortOI = s.shortOI >= deltaSize ? s.shortOI - deltaSize : 0;
            }
        }

        emit ShardAllocated(shardId, isLong, deltaSize, isIncrease);
    }

    function aggregateTotalOI() public view returns (uint256 totalLongs, uint256 totalShorts) {
        unchecked {
            for (uint8 i = 0; i < NUM_SHARDS; i++) {
                totalLongs += shards[i].longOI;
                totalShorts += shards[i].shortOI;
            }
        }
    }
}
