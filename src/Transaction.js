import crypto from "crypto";

class Transaction {
    #input_addr;
    #output_addr;

    #funds;
    #timestamp;

    #signature;
    
    #hash;

    constructor (input_addr, output_addr, funds, timestamp, signature) {
        this.#input_addr = input_addr;
        this.#output_addr = output_addr;

        this.#funds = funds;
        this.#timestamp = timestamp;

        this.#signature = signature;

        this.#hash = this.#generate_hash();
    }

    get input_addr () { return this.#input_addr; }
    get output_addr () { return this.#output_addr; }

    get funds () { return this.#funds; }
    get timestamp () { return this.#timestamp; }
    
    get signature () { return this.#signature; }

    get hash () { return this.#hash; }

    set input_addr (value) { this.#input_addr = value; }
    set output_addr (value) { this.#output_addr = value; }

    set funds (value) { this.#funds = value; }
    set timestamp (value) { this.#timestamp = value; }
    
    set signature (value) { this.#signature = value; } 

    set hash (value) { this.#hash = value; }

    to_string() { 
        return `---------------
| Transaction |
----------------------------------------------------------------------------
Input addr: ${ this.#input_addr }
Output addr: ${ this.#output_addr }
Funds: ${ this.#funds }
Timestamp: ${ this.#timestamp }
Signature: ${ this.#signature }
Hash: ${ this.#hash }
----------------------------------------------------------------------------\n`
    }

    verify_signature (public_key) {
        const verifier = crypto
            .createVerify("SHA256")
            .update(`${ this.#input_addr }${ this.#output_addr }${ this.#funds }${ this.#timestamp }`)
            .end();

        return verifier.verify(public_key, this.#signature, "hex");
    }

    verify_hash () { return this.#hash === ( this.#generate_hash() ); }

    #generate_hash () {
        const hash = crypto
            .createHash("SHA256")
            .update(`${ this.#input_addr }${ this.#output_addr }${ this.#funds }${ this.#timestamp }`)
            .digest("hex");

        return hash;
    }
}

export default Transaction;