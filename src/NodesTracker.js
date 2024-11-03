class NodesTracker {
    add_leader_replica_node (node) {
        if (this.leader_replica_node) 
            return false;

        this.leader_replica_node = node;
        return true;
    }

    add_replica_node (node) {
        if (!this.replica_nodes) 
            this.replica_nodes = [];

        this.replica_nodes.push(node);
    }

    get_replica_nodes () {
        if (
            !this.client_node && 
            !this.leader_replica_node &&
            !this.replica_nodes &&
            !this.replica_nodes.length === 0
        ) return [];

        return [this.leader_replica_node, ...this.replica_nodes];
    }

    get_replica_nodes_wout_leader () {
        if (
            !this.client_node && 
            !this.leader_replica_node &&
            !this.replica_nodes &&
            !this.replica_nodes.length === 0
        ) return [];

        return this.replica_nodes;
    }
}

export default NodesTracker;