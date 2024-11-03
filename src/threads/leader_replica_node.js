import { parentPort, workerData } from "node:worker_threads";

import ESSerializer from "esserializer";

import Transaction from "../Transaction.js";
import Blockchain from "../Blockchain.js";

import { sleep } from "../utils.js";

const   blockchain = new Blockchain();

const   transactions = ESSerializer.deserialize(workerData.transactions, [Transaction]);
const   private_key = workerData.private_key;
const   nodes_count = workerData.nodes_count;

const   nodes_count_two_thirds = Math.floor((2 / 3) * nodes_count);
let     nodes_committed = 0;  

const generated_block = blockchain.generate_block(transactions, private_key);
parentPort.postMessage({ generated_block: ESSerializer.serialize(generated_block) });

parentPort.on("message", async ({ message, block, leader_replica_public_key, delay }) => {
    if (!message) return;

    await sleep(delay);

    if (message === "commit") {
        nodes_committed++;

        if (nodes_committed === nodes_count_two_thirds)
            parentPort.postMessage("consensus_reached");
    }
});