import crypto from "crypto";

import ESSerializer from "esserializer";
import { Worker } from "node:worker_threads";

import Transaction from "./Transaction.js";
import Block from "./Block.js";

import NodesTracker from "./NodesTracker.js";

(async () => {
    const   N = 10,
            DELAY = 100;

    const   user_01__keys = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }),
            user_02__keys = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });

    const   transaction_01__input_addr = "user_1",
            transaction_01__output_addr = "user_2",
            transaction_01__funds = 10,
            transaction_01__timestamp = Date.now(),
            transaction_01__signature = crypto
                .createSign("SHA256") 
                .update(`${ transaction_01__input_addr }${ transaction_01__output_addr }${ transaction_01__funds }${ transaction_01__timestamp }`)
                .end() 
                .sign(
                    user_01__keys
                        .privateKey
                        .export({ type: "pkcs1", format: "pem" }), 
                    "hex"
                );

    const   transaction_02__input_addr = "user_2",
            transaction_02__output_addr = "user_3",
            transaction_02__funds = 10,
            transaction_02__timestamp = Date.now(),
            transaction_02__signature = crypto
                .createSign("SHA256")
                .update( 
                    crypto.createHash("SHA256")
                        .update(`${ transaction_02__input_addr }${ transaction_02__output_addr }${ transaction_02__funds }${ transaction_02__timestamp }`)
                        .digest("hex")
                )
                .sign(user_02__keys.privateKey.export({ type: "pkcs1", format: "pem" }), "hex");
            
    const   transaction_01 = new Transaction(transaction_01__input_addr, transaction_01__output_addr, transaction_01__funds, transaction_01__timestamp, transaction_01__signature),
            transaction_02 = new Transaction(transaction_02__input_addr, transaction_02__output_addr, transaction_02__funds, transaction_02__timestamp, transaction_02__signature);

    const transactions = [transaction_01, transaction_02];

    const nodes_tracker = new NodesTracker();

    const block_approval_start_time = process.hrtime();
    console.log("client node initiated a request (to add a new block to the blockchain)");
    const   leader_replica_node = new Worker(
                "./src/threads/leader_replica_node.js", 
                {
                    workerData: { 
                        transactions: ESSerializer.serialize(transactions),
                        private_key:  user_01__keys.privateKey.export({ type: "pkcs1", format: "pem" }),
                        nodes_count: N
                    }
                }
            );
    nodes_tracker.add_leader_replica_node(leader_replica_node);

    for (let k = 0; k < N; k++) {
        const replica_node = new Worker(
            "./src/threads/replica_node.js",
            { 
                workerData: {
                    transactions: null,
                    private_key: null,
                    nodes_count: N
                }
            }
        );

        nodes_tracker.add_replica_node(replica_node);
    }

    leader_replica_node.on("message", (message) => {
        if (!message.generated_block) {
            if (message !== "consensus_reached") return;

            const block_approval_end_time = process.hrtime(block_approval_start_time);
            const block_approval_duration_sec = block_approval_end_time[0] + block_approval_end_time[1] / 1e9;

            console.log();
            console.log("client node received a positive response (block was successfully added to the blockchain)");
            console.log(`time taken to approve the block in the blockchain with a fixed delay time of ${ DELAY }ms and ${ N } nodes: ${ block_approval_duration_sec }s`);
            return;
        }

        const generated_block = ESSerializer.deserialize(message.generated_block, [Transaction, Block]);

        console.log("leader replica node (R0) generated the block and added it to its local blockchain\n");
        console.log(generated_block.to_string());

        nodes_tracker.get_replica_nodes_wout_leader().forEach((worker, idx) => {
            worker.on("message", (message) => {
                if (message === "valid") {
                    console.log(`replica node (R${ idx + 1 }) validated the block`);

                    nodes_tracker.get_replica_nodes().forEach((worker, _idx) => {
                        if (idx === _idx) return;
                        
                        worker.postMessage({
                            message: "valid", 
                            block: ESSerializer.serialize(generated_block), 
                            leader_replica_public_key: null, 
                            delay: DELAY
                        });
                    });
                }
                else if (message === "invalid")
                    console.log(`replica node (R${ idx + 1 }) invalidated the block`);
                else if (message === "commit") {
                    console.log(`replica node (R${ idx + 1 }) committed the block`);
                    leader_replica_node.postMessage({
                        message: "commit", 
                        block: null, 
                        leader_replica_public_key: null, 
                        delay: DELAY
                    });
                }
            });

            worker.postMessage({
                message: "validate_block",
                block: ESSerializer.serialize(generated_block),
                leader_replica_public_key: user_01__keys.publicKey.export({ type: "pkcs1", format: "pem" }),
                delay: DELAY
            });
            console.log(`leader replica node (R0) sent the block to the R${ idx + 1 } replica node`);
        });
        console.log();
    });
})();