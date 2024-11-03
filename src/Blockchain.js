import crypto from "crypto";

import Block from "./Block.js";

class Blockchain {
    constructor () {
        this.blocks = [];
        this.#generate_genesis_block();
    }

    add_block (block) { this.blocks.push(block); }

    get_last_block () { return this.blocks[this.blocks.length - 1]; }

    get_block_by_index (idx) {
        if (idx < 0 || idx >= this.blocks.length)
            throw new Error("invalid block index");

        return this.blocks[idx];
    }

    get_block_by_hash (hash) {
        const block = this.blocks
            .find(block => block.hash === hash);

        if (!block) 
            throw new Error("block with the corresponding hash was not found");

        return block;
    }

    generate_block (transactions, private_key) {
        const previous_block = this.get_last_block();
        const block = new Block(
            previous_block.version,
            Date.now(),
            previous_block.difficulty,
            previous_block.nonce,
            transactions,
            null,
            previous_block.hash
        );

        block.signature = crypto
            .createSign("SHA256")
            .update(`${ block.timestamp }${ block.transactions.map(tx => tx.signature).join("") }${ block.previous_hash }`)
            .sign(private_key, "hex");

        this.blocks.push(block);
        return block;
    }
    
    #generate_genesis_block () {
        const block = new Block("0.0.1 (beta)", Date.now(), 3, 0, [], "genesis_signature", "");
        this.blocks.push(block);
    }
}

export default Blockchain;
