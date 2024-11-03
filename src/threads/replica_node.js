import { parentPort, workerData } from "node:worker_threads";

import ESSerializer from "esserializer";

import Transaction from "../Transaction.js";
import Block from "../Block.js";
import Blockchain from "../Blockchain.js";

import { sleep } from "../utils.js";

const   blockchain = new Blockchain();

const   nodes_count = workerData.nodes_count;

const   nodes_count_two_thirds = Math.floor((2 / 3) * nodes_count);
let     nodes_validated = 0;    

parentPort.on("message", async ({ message, block, leader_replica_public_key, delay }) => {
    if (!message) return;

    await sleep(delay);

    if (message === "validate_block") {
        block = ESSerializer.deserialize(block, [Transaction, Block]);
        block = new Block(
            block.version,
            block.timestamp,
            block.difficulty,
            block.nonce,

            block.transactions,

            block.signature,

            block.previous_hash,
            block.hash,

            block.merkle_root
        );

        if (
            !block.verify_signature(leader_replica_public_key) &&
            !block.verify_hash() &&
            !block.verify_merkle_root()
        ) {
            parentPort.postMessage("invalid");
            return;
        }

        parentPort.postMessage("valid");
    }
    else if (message === "valid") {
        nodes_validated++;

        if (nodes_validated === nodes_count_two_thirds) {
            block = ESSerializer.deserialize(block, [Transaction, Block]);
            block = new Block(
                block.version,
                block.timestamp,
                block.difficulty,
                block.nonce,
    
                block.transactions,
    
                block.signature,
    
                block.previous_hash,
                block.hash,
    
                block.merkle_root
            );

            blockchain.add_block(block);
            parentPort.postMessage("commit");
        }
    }
});