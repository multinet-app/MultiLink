import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { createDirectStore } from 'direct-vuex';

import { Link, Node, Network } from '@/types';
import api from '@/api';
import { GraphSpec, RowsSpec, TableRow } from 'multinet';

Vue.use(Vuex);

interface LoadError {
  message: string;
  buttonText: string;
  href: string;
}

export interface State {
  workspaceName: string | null;
  networkName: string | null;
  network: Network | null;
  selectedNodes: Set<string>;
  loadError: LoadError;
}

const {
  store,
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext,
} = createDirectStore({
  state: {
    workspaceName: null,
    networkName: null,
    network: null,
    selectedNodes: new Set(),
    loadError: {
      message: '',
      buttonText: '',
      href: '',
    },
  } as State,
  getters: {
    workspaceName(state: State) {
      return state.workspaceName;
    },

    networkName(state: State) {
      return state.networkName;
    },

    network(state: State) {
      return state.network;
    },

    selectedNodes(state: State) {
      return state.selectedNodes;
    },

    loadError(state: State) {
      return state.loadError;
    },
  },
  mutations: {
    setWorkspaceName(state, workspaceName: string) {
      state.workspaceName = workspaceName;
    },

    setNetworkName(state, networkName: string) {
      state.networkName = networkName;
    },

    setNetwork(state, network: Network) {
      state.network = network;
    },

    setSelected(state, selectedNodes: Set<string>) {
      state.selectedNodes = selectedNodes;
    },

    setLoadError(state, loadError: LoadError) {
      state.loadError = {
        message: loadError.message,
        buttonText: loadError.buttonText,
        href: loadError.href,
      };
    },

    addSelectedNode(state, nodeID: string) {
      state.selectedNodes.add(nodeID);
    },

    removeSelectedNode(state, nodeID: string) {
      state.selectedNodes.delete(nodeID);
    },
  },
  actions: {
    async fetchNetwork(context, { workspaceName, networkName }) {
      const { commit } = rootActionContext(context);
      commit.setWorkspaceName(workspaceName);
      commit.setNetworkName(networkName);

      let networkTables: GraphSpec | undefined;

      // Get all table names
      try {
        networkTables = await api.graph(workspaceName, networkName);
      } catch (error) {
        if (error.status === 404) {
          commit.setLoadError({
            message: error.statusText,
            buttonText: 'Back to MultiNet',
            href: '/',
          });
        }

        commit.setLoadError({
          message: 'An unexpected error ocurred',
          buttonText: 'Back to MultiNet',
          href: '/',
        });
      }

      if (networkTables === undefined) {
        return;
      }

      // Generate all node table promises
      const nodePromises: Promise<RowsSpec>[] = [];
      networkTables.nodeTables.forEach((table) => {
        nodePromises.push(api.table(workspaceName, table, { offset: 0, limit: 1000 }));
      });

      // Resolve all node table promises and extract the rows
      const resolvedNodePromises = await Promise.all(nodePromises);
      const nodes: TableRow[] = [];
      resolvedNodePromises.forEach((resolvedPromise) => {
        nodes.push(...resolvedPromise.rows);
      });

      // Generate and resolve edge table promise and extract rows
      const edgePromise = await api.table(workspaceName, networkTables.edgeTable, { offset: 0, limit: 1000 });
      const edges = edgePromise.rows;

      // Build the network object and set it as the network in the store
      const network = {
        nodes: nodes as Node[],
        edges: edges as Link[],
      };
      commit.setNetwork(network);
    },
  },
});

export default store;
export {
  rootActionContext,
  moduleActionContext,
  rootGetterContext,
  moduleGetterContext,
};

// The following lines enable types in the injected store '$store'.
export type ApplicationStore = typeof store;
declare module 'vuex' {
  interface Store<S> {
    direct: ApplicationStore;
  }
}